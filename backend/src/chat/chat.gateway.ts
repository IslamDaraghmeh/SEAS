import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers: Map<string, Set<string>> = new Map(); // attemptId -> Set of userIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      console.log(`Chat client connected: ${client.id}, User: ${client.user.email}`);
    } catch (error) {
      console.error('Chat authentication failed:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    // Remove from typing users
    if (client.user) {
      this.typingUsers.forEach((users, attemptId) => {
        if (users.has(client.user!.id)) {
          users.delete(client.user!.id);
          this.server.to(`chat:${attemptId}`).emit('userStoppedTyping', {
            userId: client.user!.id,
            attemptId,
          });
        }
      });
    }
    console.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    client.join(`chat:${data.attemptId}`);

    // Get chat history
    const messages = await this.chatService.getMessages(data.attemptId);

    // Mark messages as read
    await this.chatService.markAllAsRead(data.attemptId, client.user.id);

    return { success: true, messages: messages.reverse() };
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    client.leave(`chat:${data.attemptId}`);

    // Remove from typing users
    const typingSet = this.typingUsers.get(data.attemptId);
    if (typingSet) {
      typingSet.delete(client.user.id);
    }

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string; message: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    try {
      const chatMessage = await this.chatService.sendMessage({
        attemptId: data.attemptId,
        senderId: client.user.id,
        senderRole: client.user.role,
        message: data.message,
      });

      // Stop typing indicator
      const typingSet = this.typingUsers.get(data.attemptId);
      if (typingSet) {
        typingSet.delete(client.user.id);
      }

      // Broadcast message to all in chat room
      this.server.to(`chat:${data.attemptId}`).emit('newMessage', {
        id: chatMessage.id,
        attemptId: chatMessage.attemptId,
        senderId: chatMessage.senderId,
        senderRole: chatMessage.senderRole,
        senderEmail: client.user.email,
        message: chatMessage.message,
        isRead: false,
        createdAt: chatMessage.createdAt.toISOString(),
      });

      return { success: true, message: chatMessage };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string; messageId?: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    if (data.messageId) {
      await this.chatService.markAsRead(data.messageId);
    } else {
      await this.chatService.markAllAsRead(data.attemptId, client.user.id);
    }

    // Notify sender that messages were read
    this.server.to(`chat:${data.attemptId}`).emit('messagesRead', {
      attemptId: data.attemptId,
      readBy: client.user.id,
      messageId: data.messageId,
    });

    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string; isTyping: boolean },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    if (!this.typingUsers.has(data.attemptId)) {
      this.typingUsers.set(data.attemptId, new Set());
    }

    const typingSet = this.typingUsers.get(data.attemptId)!;

    if (data.isTyping) {
      typingSet.add(client.user.id);
      client.to(`chat:${data.attemptId}`).emit('userTyping', {
        userId: client.user.id,
        email: client.user.email,
        attemptId: data.attemptId,
      });
    } else {
      typingSet.delete(client.user.id);
      client.to(`chat:${data.attemptId}`).emit('userStoppedTyping', {
        userId: client.user.id,
        attemptId: data.attemptId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const count = await this.chatService.getUnreadCount(
      data.attemptId,
      client.user.id,
    );

    return { success: true, count };
  }

  @SubscribeMessage('getExamUnreadCounts')
  async handleGetExamUnreadCounts(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const counts = await this.chatService.getUnreadCountsForExam(
      data.examId,
      client.user.id,
    );

    return { success: true, counts };
  }
}
