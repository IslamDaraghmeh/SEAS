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
import { WebRTCService } from './webrtc.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  peerId?: string;
  roomId?: string;
  clientRole?: 'student' | 'proctor';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/webrtc',
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track peers in rooms
  private rooms: Map<string, Set<string>> = new Map();
  private peerInfo: Map<string, {
    socketId: string;
    userId: string;
    role: 'student' | 'proctor';
    studentId?: string;
    studentName?: string;
    attemptId?: string;
  }> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private webrtcService: WebRTCService,
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
        name: payload.name,
      };

      client.peerId = client.id;
      console.log(`WebRTC client connected: ${client.id}, User: ${client.user.email}`);
    } catch (error) {
      console.error('WebRTC authentication failed:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.peerId) {
      this.webrtcService.unregisterPeer(client.peerId);

      // Remove from room and notify others
      if (client.roomId) {
        const room = this.rooms.get(client.roomId);
        if (room) {
          room.delete(client.peerId);

          // Notify others in room
          client.to(client.roomId).emit('peerLeft', { peerId: client.peerId });
        }
      }

      // Clean up peer info
      this.peerInfo.delete(client.peerId);
    }
    console.log(`WebRTC client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; role: 'student' | 'proctor' },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const { roomId, role } = data;
    client.roomId = roomId;
    client.clientRole = role;

    // Join socket.io room
    client.join(roomId);

    // Track in our rooms map
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.peerId!);

    // Store peer info
    this.peerInfo.set(client.peerId!, {
      socketId: client.id,
      userId: client.user.id,
      role,
      studentId: role === 'student' ? client.user.id : undefined,
      studentName: role === 'student' ? client.user.name : undefined,
    });

    console.log(`Peer ${client.peerId} joined room ${roomId} as ${role}`);

    return { success: true, peerId: client.peerId };
  }

  @SubscribeMessage('studentReady')
  handleStudentReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { hasStream: boolean; attemptId?: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };
    if (client.clientRole !== 'student') return { error: 'Not a student' };

    // Update peer info with attempt
    const peerInfo = this.peerInfo.get(client.peerId!);
    if (peerInfo && data.attemptId) {
      peerInfo.attemptId = data.attemptId;
    }

    // Notify proctors in the room
    if (client.roomId) {
      client.to(client.roomId).emit('peerJoined', {
        peerId: client.peerId,
        studentId: client.user.id,
        studentName: client.user.name || client.user.email,
        attemptId: data.attemptId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('requestStream')
  handleRequestStream(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { studentId: string; attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };
    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    // Find the student's peer
    let studentPeerId: string | null = null;
    this.peerInfo.forEach((info, peerId) => {
      if (info.studentId === data.studentId || info.attemptId === data.attemptId) {
        studentPeerId = peerId;
      }
    });

    if (studentPeerId) {
      // Send request to student to initiate connection
      this.server.to(studentPeerId).emit('streamRequested', {
        proctorPeerId: client.peerId,
        proctorId: client.user.id,
      });
      return { success: true, studentPeerId };
    }

    return { success: false, error: 'Student not found' };
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { peerId: string; signal: any },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    // Forward signal to target peer
    this.server.to(data.peerId).emit('signal', {
      peerId: client.peerId,
      signal: data.signal,
    });

    return { success: true };
  }

  @SubscribeMessage('getIceServers')
  handleGetIceServers(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return { error: 'Unauthorized' };
    return { success: true, iceServers: this.webrtcService.getIceServers() };
  }

  @SubscribeMessage('registerPeer')
  handleRegisterPeer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
    },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const peerId = client.id;
    client.peerId = peerId;

    this.webrtcService.registerPeer(
      peerId,
      data.attemptId,
      data.examId,
      client.user.id,
      client.user.role,
    );

    // Join rooms for signaling
    client.join(`exam:${data.examId}`);
    client.join(`attempt:${data.attemptId}`);

    return { success: true, peerId };
  }

  @SubscribeMessage('startWatching')
  handleStartWatching(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };
    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    const proctorPeerId = client.peerId || client.id;
    this.webrtcService.startWatching(proctorPeerId, data.attemptId);

    // Get student's peer to initiate connection
    const studentPeer = this.webrtcService.getStudentPeerForAttempt(data.attemptId);
    if (studentPeer) {
      // Notify student that a proctor wants to connect
      this.server.to(`attempt:${data.attemptId}`).emit('proctorConnecting', {
        proctorPeerId,
        attemptId: data.attemptId,
      });
    }

    return { success: true, studentPeerId: studentPeer?.peerId };
  }

  @SubscribeMessage('stopWatching')
  handleStopWatching(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const proctorPeerId = client.peerId || client.id;
    this.webrtcService.stopWatching(proctorPeerId, data.attemptId);

    return { success: true };
  }

  // WebRTC Signaling
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      targetPeerId: string;
      peerId?: string;
      offer: RTCSessionDescriptionInit;
    },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const fromPeerId = client.peerId || client.id;
    const targetPeerId = data.targetPeerId || data.peerId;

    // Forward offer to target peer
    this.server.to(targetPeerId).emit('offer', {
      peerId: fromPeerId,
      fromPeerId,
      offer: data.offer,
    });

    return { success: true };
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      targetPeerId: string;
      peerId?: string;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const fromPeerId = client.peerId || client.id;
    const targetPeerId = data.targetPeerId || data.peerId;

    // Forward answer to target peer
    this.server.to(targetPeerId).emit('answer', {
      peerId: fromPeerId,
      fromPeerId,
      answer: data.answer,
    });

    return { success: true };
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      targetPeerId: string;
      peerId?: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const fromPeerId = client.peerId || client.id;
    const targetPeerId = data.targetPeerId || data.peerId;

    // Forward ICE candidate to target peer
    this.server.to(targetPeerId).emit('iceCandidate', {
      peerId: fromPeerId,
      fromPeerId,
      candidate: data.candidate,
    });

    return { success: true };
  }

  @SubscribeMessage('getActiveStreams')
  handleGetActiveStreams(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return { error: 'Unauthorized' };
    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    return {
      success: true,
      streams: this.webrtcService.getActiveStreams(),
    };
  }

  @SubscribeMessage('getRoomPeers')
  handleGetRoomPeers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.user) return { error: 'Unauthorized' };

    const room = this.rooms.get(data.roomId);
    if (!room) {
      return { success: true, peers: [] };
    }

    const peers = Array.from(room).map(peerId => {
      const info = this.peerInfo.get(peerId);
      return {
        peerId,
        role: info?.role,
        studentId: info?.studentId,
        studentName: info?.studentName,
        attemptId: info?.attemptId,
      };
    });

    return { success: true, peers };
  }
}
