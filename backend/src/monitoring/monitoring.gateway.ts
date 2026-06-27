import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { MonitoringService } from './monitoring.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    teacherId?: string; // Added for teacher ownership verification
  };
  attemptId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/monitoring',
})
export class MonitoringGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private monitoringService: MonitoringService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token ||
                    client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Look up teacherId if user is a teacher
      let teacherId: string | undefined;
      if (payload.role === 'TEACHER') {
        const teacher = await this.prisma.teacher.findFirst({
          where: { userId: payload.sub },
          select: { id: true },
        });
        teacherId = teacher?.id;
      }

      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        teacherId,
      };

      console.log(`Client connected: ${client.id}, User: ${client.user.email}, Role: ${client.user.role}, TeacherId: ${teacherId || 'N/A'}`);
    } catch (error) {
      console.error('Authentication failed:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.attemptId) {
      await this.monitoringService.setStudentOffline(client.attemptId);

      // Notify proctors
      this.server.to(`exam:${client.attemptId}`).emit('studentOffline', {
        attemptId: client.attemptId,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinExamRoom')
  async handleJoinExamRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string },
  ) {
    try {
      if (!client.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Only allow teachers, admins, and proctors to join exam rooms
      if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
        return { success: false, error: 'Unauthorized' };
      }

      // For teachers, verify they own the course for this exam
      if (client.user.role === 'TEACHER' && client.user.teacherId) {
        const exam = await this.prisma.exam.findUnique({
          where: { id: data.examId },
          include: {
            course: {
              select: { teacherId: true },
            },
          },
        });

        if (!exam) {
          return { success: false, error: 'Exam not found' };
        }

        if (exam.course.teacherId !== client.user.teacherId) {
          return { success: false, error: 'You can only monitor exams for your own courses' };
        }
      }

      client.join(`exam:${data.examId}`);

      // Send initial monitoring data
      const monitoringData = await this.monitoringService.getExamMonitoringData(
        data.examId,
      );

      console.log(`Teacher ${client.user.email} joined exam room: ${data.examId}`);
      console.log(`Monitoring data: ${monitoringData.students?.length || 0} students, active: ${monitoringData.activeStudents}`);
      if (monitoringData.students?.length > 0) {
        console.log('Students:', monitoringData.students.map(s => `${s.studentName} (${s.attemptId}, online: ${s.isOnline})`).join(', '));
      }
      return { success: true, data: monitoringData };
    } catch (error) {
      console.error('Error joining exam room:', error);
      return { success: false, error: 'Failed to join exam room' };
    }
  }

  @SubscribeMessage('leaveExamRoom')
  handleLeaveExamRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string },
  ) {
    client.leave(`exam:${data.examId}`);
    return { success: true };
  }

  @SubscribeMessage('studentJoinExam')
  async handleStudentJoinExam(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { attemptId: string; examId: string },
  ) {
    console.log(`Student joining exam: ${client.user?.email}, attemptId: ${data.attemptId}, examId: ${data.examId}`);

    if (!client.user || client.user.role !== 'STUDENT') {
      console.log('Student join rejected: not a student or not authenticated');
      return { success: false, error: 'Unauthorized' };
    }

    client.attemptId = data.attemptId;
    await this.monitoringService.setStudentOnline(data.attemptId, client.id);
    console.log(`Student ${client.user.email} joined exam ${data.examId} successfully`);

    // Notify proctors
    this.server.to(`exam:${data.examId}`).emit('studentOnline', {
      attemptId: data.attemptId,
      timestamp: new Date().toISOString(),
    });

    // Log activity
    await this.monitoringService.logStudentActivity(data.attemptId, {
      type: 'JOINED_EXAM',
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('studentActivity')
  async handleStudentActivity(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
      type: string;
      metadata?: Record<string, any>;
    },
  ) {
    if (!client.user || client.user.role !== 'STUDENT') {
      return { error: 'Unauthorized' };
    }

    await this.monitoringService.logStudentActivity(data.attemptId, {
      type: data.type,
      timestamp: new Date(),
      metadata: data.metadata,
    });

    // Notify proctors
    this.server.to(`exam:${data.examId}`).emit('studentActivity', {
      attemptId: data.attemptId,
      type: data.type,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    });

    // Handle tab switch events specially - create alert
    if (data.type === 'TAB_SWITCH' || data.type === 'VIOLATION') {
      await this.handleTabSwitchViolation(data, client);
    }

    return { success: true };
  }

  // Handle tab switch violations
  private async handleTabSwitchViolation(
    data: {
      attemptId: string;
      examId: string;
      type: string;
      metadata?: Record<string, any>;
    },
    client: AuthenticatedSocket,
  ) {
    try {
      const tabSwitchCount = data.metadata?.count || data.metadata?.totalCount || 1;

      // Update attempt's tab switch count
      await this.prisma.examAttempt.update({
        where: { id: data.attemptId },
        data: {
          tabSwitchCount: tabSwitchCount,
          metadata: {
            lastTabSwitch: new Date().toISOString(),
            violations: data.metadata,
          },
        },
      });

      // Get student info for the alert
      const attempt = await this.prisma.examAttempt.findUnique({
        where: { id: data.attemptId },
        include: {
          student: { select: { nameEn: true, studentNumber: true } },
        },
      });

      // Determine severity based on count
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (tabSwitchCount >= 5) severity = 'CRITICAL';
      else if (tabSwitchCount >= 3) severity = 'HIGH';
      else if (tabSwitchCount >= 2) severity = 'MEDIUM';

      // Create alert for significant tab switches
      if (tabSwitchCount >= 2) {
        const alert = await this.prisma.examAlert.create({
          data: {
            attemptId: data.attemptId,
            type: 'SUSPICIOUS_BEHAVIOR',
            severity,
            message: `Tab switch detected (${tabSwitchCount} times) - ${attempt?.student.nameEn || 'Unknown'}`,
            metadata: {
              ...data.metadata,
              studentName: attempt?.student.nameEn,
              studentNumber: attempt?.student.studentNumber,
            },
          },
        });

        // Notify proctors of the alert
        this.server.to(`exam:${data.examId}`).emit('newAlert', {
          alertId: alert.id,
          attemptId: data.attemptId,
          type: 'SUSPICIOUS_BEHAVIOR',
          severity,
          message: alert.message,
          metadata: alert.metadata,
          timestamp: alert.createdAt.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error handling tab switch violation:', error);
    }
  }

  @SubscribeMessage('verificationResult')
  async handleVerificationResult(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
      isVerified: boolean;
      matchScore: number;
    },
  ) {
    // Notify proctors of verification result
    this.server.to(`exam:${data.examId}`).emit('verificationUpdate', {
      attemptId: data.attemptId,
      isVerified: data.isVerified,
      matchScore: data.matchScore,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('alertCreated')
  async handleAlertCreated(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      examId: string;
      attemptId: string;
      alertId: string;
      type: string;
      severity: string;
      message: string;
    },
  ) {
    // Notify proctors of new alert
    this.server.to(`exam:${data.examId}`).emit('newAlert', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('requestMonitoringUpdate')
  async handleRequestUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string },
  ) {
    if (!client.user) return;

    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    console.log(`Monitoring update requested by ${client.user.email} for exam ${data.examId}`);
    const monitoringData = await this.monitoringService.getExamMonitoringData(
      data.examId,
    );
    console.log(`Update response: ${monitoringData.students?.length || 0} students`);

    return { success: true, data: monitoringData };
  }

  // Method to broadcast updates to all proctors watching an exam
  async broadcastExamUpdate(examId: string) {
    const monitoringData = await this.monitoringService.getExamMonitoringData(
      examId,
    );

    this.server.to(`exam:${examId}`).emit('examUpdate', monitoringData);
  }

  // Method to send message to specific student
  sendToStudent(attemptId: string, event: string, data: any) {
    // Find the socket for this attempt
    // This would need to be tracked when students join
    this.server.emit(`student:${attemptId}:${event}`, data);
  }

  // Student sends camera frame for proctors to view
  @SubscribeMessage('studentFrame')
  async handleStudentFrame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
      frame: string; // Base64 encoded image
      timestamp: string;
    },
  ) {
    if (!client.user || client.user.role !== 'STUDENT') {
      return { error: 'Unauthorized' };
    }

    // Log frame received (only log occasionally to avoid spam)
    const frameSize = data.frame?.length || 0;
    if (Math.random() < 0.1) { // Log ~10% of frames
      console.log(`Frame received from ${client.user.email} for exam ${data.examId}, size: ${frameSize} bytes`);
    }

    // Forward frame to proctors watching this exam
    this.server.to(`exam:${data.examId}`).emit('studentFrame', {
      attemptId: data.attemptId,
      frame: data.frame,
      timestamp: data.timestamp,
    });

    return { success: true };
  }

  // Proctor requests verification from a specific student
  @SubscribeMessage('requestVerification')
  async handleRequestVerification(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
    },
  ) {
    if (!client.user) return;

    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    // Send verification request to the specific student
    this.server.emit(`verification:${data.attemptId}`, {
      requested: true,
      requestedBy: client.user.email,
      timestamp: new Date().toISOString(),
    });

    // Log the verification request
    await this.monitoringService.logStudentActivity(data.attemptId, {
      type: 'VERIFICATION_REQUESTED',
      timestamp: new Date(),
      metadata: { requestedBy: client.user.email },
    });

    // Notify other proctors that verification was requested
    this.server.to(`exam:${data.examId}`).emit('verificationRequested', {
      attemptId: data.attemptId,
      requestedBy: client.user.email,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // Flag a student
  @SubscribeMessage('flagStudent')
  async handleFlagStudent(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      attemptId: string;
      examId: string;
      reason: string;
    },
  ) {
    if (!client.user) return;

    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    // Log the flagging
    await this.monitoringService.logStudentActivity(data.attemptId, {
      type: 'FLAGGED',
      timestamp: new Date(),
      metadata: { reason: data.reason, flaggedBy: client.user.email },
    });

    // Notify all proctors
    this.server.to(`exam:${data.examId}`).emit('studentFlagged', {
      attemptId: data.attemptId,
      reason: data.reason,
      flaggedBy: client.user.email,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // Get active students with their connection status
  @SubscribeMessage('getActiveStudents')
  async handleGetActiveStudents(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string },
  ) {
    if (!client.user) return;

    if (!['TEACHER', 'ADMIN', 'PROCTOR'].includes(client.user.role)) {
      return { error: 'Unauthorized' };
    }

    const activeStudents = await this.monitoringService.getActiveStudents(data.examId);
    return { success: true, data: activeStudents };
  }

  // ============= EVENT LISTENERS FOR VERIFICATION =============

  // Listen for all verification results and broadcast to proctors
  @OnEvent('verification.result')
  handleVerificationResultEvent(data: {
    verificationId: string;
    attemptId: string;
    examId: string;
    studentId: string;
    studentNumber: string;
    studentName: string;
    studentEmail: string;
    isVerified: boolean;
    matchScore: number;
    livenessScore: number;
    timestamp: string;
    capturedImage?: string;
    currentQuestion?: {
      id: string;
      text: string;
      order: number;
    };
    attemptInfo: {
      startedAt: Date;
      examTitle: string;
    };
  }) {
    console.log(`Broadcasting verification result for exam ${data.examId}, student ${data.studentNumber}, verified: ${data.isVerified}`);

    // Broadcast to all proctors watching this exam
    this.server.to(`exam:${data.examId}`).emit('verificationResult', {
      type: data.isVerified ? 'success' : 'failed',
      verificationId: data.verificationId,
      attemptId: data.attemptId,
      studentId: data.studentId,
      studentNumber: data.studentNumber,
      studentName: data.studentName,
      isVerified: data.isVerified,
      matchScore: data.matchScore,
      livenessScore: data.livenessScore,
      timestamp: data.timestamp,
      // Include image for failed verifications
      capturedImage: data.capturedImage,
      // Include current question context for failed verifications
      currentQuestion: data.currentQuestion,
      attemptInfo: data.attemptInfo,
    });
  }

  // Listen specifically for failed verifications (higher priority alert)
  @OnEvent('verification.failed')
  handleVerificationFailedEvent(data: {
    verificationId: string;
    attemptId: string;
    examId: string;
    studentId: string;
    studentNumber: string;
    studentName: string;
    studentEmail: string;
    isVerified: boolean;
    matchScore: number;
    timestamp: string;
    capturedImage: string;
    currentQuestion?: {
      id: string;
      text: string;
      order: number;
    };
    attemptInfo: {
      startedAt: Date;
      examTitle: string;
    };
  }) {
    console.log(`Broadcasting FAILED verification alert for exam ${data.examId}, student ${data.studentNumber}`);

    // Send a high-priority alert for failed verifications
    this.server.to(`exam:${data.examId}`).emit('verificationAlert', {
      severity: 'high',
      type: 'VERIFICATION_FAILED',
      verificationId: data.verificationId,
      attemptId: data.attemptId,
      studentId: data.studentId,
      studentNumber: data.studentNumber,
      studentName: data.studentName,
      matchScore: data.matchScore,
      timestamp: data.timestamp,
      capturedImage: data.capturedImage,
      currentQuestion: data.currentQuestion,
      attemptInfo: data.attemptInfo,
      message: `Verification failed for ${data.studentName} (${data.studentNumber}) - Match score: ${(data.matchScore * 100).toFixed(1)}%`,
    });
  }

  // Listen for manual verification events
  @OnEvent('verification.manual')
  handleManualVerificationEvent(data: {
    verificationLogId: string;
    attemptId: string;
    examId: string;
    studentId: string;
    approved: boolean;
    verifiedBy: string;
    notes?: string;
    timestamp: string;
  }) {
    console.log(`Manual verification for exam ${data.examId}: ${data.approved ? 'approved' : 'rejected'}`);

    // Broadcast manual verification to all proctors
    this.server.to(`exam:${data.examId}`).emit('manualVerification', {
      verificationLogId: data.verificationLogId,
      attemptId: data.attemptId,
      studentId: data.studentId,
      approved: data.approved,
      verifiedBy: data.verifiedBy,
      notes: data.notes,
      timestamp: data.timestamp,
    });

    // Also notify the student so their UI can update
    this.server.to(`student:${data.attemptId}`).emit(`manualVerification:${data.attemptId}`, {
      approved: data.approved,
      verifiedBy: data.verifiedBy,
      notes: data.notes,
      timestamp: data.timestamp,
    });
  }
}
