import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SendMessageDto {
  attemptId: string;
  senderId: string;
  senderRole: string;
  message: string;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(data: SendMessageDto) {
    // Verify attempt exists
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: data.attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return this.prisma.chatMessage.create({
      data: {
        attemptId: data.attemptId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        message: data.message,
      },
    });
  }

  async getMessages(attemptId: string, limit = 50, beforeId?: string) {
    const where: any = { attemptId };

    if (beforeId) {
      const beforeMessage = await this.prisma.chatMessage.findUnique({
        where: { id: beforeId },
      });
      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    return this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(messageId: string) {
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(attemptId: string, readerId: string) {
    // Mark all messages not sent by the reader as read
    return this.prisma.chatMessage.updateMany({
      where: {
        attemptId,
        senderId: { not: readerId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(attemptId: string, userId: string) {
    return this.prisma.chatMessage.count({
      where: {
        attemptId,
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  async getUnreadCountsForExam(examId: string, userId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      select: { id: true },
    });

    const counts = await Promise.all(
      attempts.map(async (attempt) => ({
        attemptId: attempt.id,
        unreadCount: await this.getUnreadCount(attempt.id, userId),
      })),
    );

    return counts.filter((c) => c.unreadCount > 0);
  }
}
