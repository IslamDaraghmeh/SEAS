import { io, Socket } from 'socket.io-client';

export interface VerificationRequest {
  requested: boolean;
  requestedBy: string;
  timestamp: string;
}

export interface ManualVerificationUpdate {
  approved: boolean;
  verifiedBy: string;
  notes?: string;
  timestamp: string;
}

type EventCallback<T> = (data: T) => void;

class StudentSocketService {
  private socket: Socket | null = null;
  private currentAttemptId: string | null = null;
  private currentExamId: string | null = null;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private getFrameCallback: (() => string | null) | null = null;

  // Event listeners
  private onVerificationRequestCallbacks: EventCallback<VerificationRequest>[] = [];
  private onManualVerificationCallbacks: EventCallback<ManualVerificationUpdate>[] = [];
  private onDisconnectCallbacks: EventCallback<void>[] = [];

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Determine WebSocket URL
      // In production with nginx proxy, use same origin (nginx proxies /monitoring to backend)
      // In development, use VITE_WS_URL or fallback to API URL without /api suffix
      let baseUrl: string;

      if (import.meta.env.VITE_WS_URL) {
        // Use configured WebSocket URL (convert ws:// to http:// for Socket.IO)
        baseUrl = import.meta.env.VITE_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');
      } else if (import.meta.env.VITE_API_URL) {
        // Derive from API URL by removing /api suffix
        baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      } else {
        // Fallback: use same origin (works with nginx proxy)
        baseUrl = window.location.origin;
      }

      console.log('Student connecting to monitoring WebSocket at:', `${baseUrl}/monitoring`);

      this.socket = io(`${baseUrl}/monitoring`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Student socket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Student socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Student socket disconnected');
        this.stopFrameStreaming();
        this.onDisconnectCallbacks.forEach(cb => cb());
      });

      // Set up verification request listener
      this.setupVerificationListener();
    });
  }

  private setupVerificationListener() {
    // We need to dynamically listen based on attemptId
    // This will be set up when joining the exam
  }

  async joinExam(attemptId: string, examId: string): Promise<boolean> {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.currentAttemptId = attemptId;
    this.currentExamId = examId;

    // Set up dynamic verification request listener
    this.socket.on(`verification:${attemptId}`, (data: VerificationRequest) => {
      console.log('Verification request received:', data);
      this.onVerificationRequestCallbacks.forEach(cb => cb(data));
    });

    // Set up manual verification listener (when teacher manually verifies)
    this.socket.on(`manualVerification:${attemptId}`, (data: ManualVerificationUpdate) => {
      console.log('Manual verification received:', data);
      this.onManualVerificationCallbacks.forEach(cb => cb(data));
    });

    return new Promise((resolve) => {
      this.socket!.emit('studentJoinExam', { attemptId, examId }, (response: any) => {
        if (response.success) {
          console.log('Joined exam successfully');
          resolve(true);
        } else {
          console.error('Failed to join exam:', response.error);
          resolve(false);
        }
      });
    });
  }

  leaveExam(): void {
    if (this.currentAttemptId) {
      // Remove the verification listeners
      this.socket?.off(`verification:${this.currentAttemptId}`);
      this.socket?.off(`manualVerification:${this.currentAttemptId}`);
    }

    this.stopFrameStreaming();
    this.currentAttemptId = null;
    this.currentExamId = null;
  }

  // Start streaming camera frames to proctors
  startFrameStreaming(getFrame: () => string | null, intervalMs: number = 3000): void {
    this.getFrameCallback = getFrame;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    // Send initial frame
    this.sendFrame();

    // Set up interval for sending frames
    this.frameInterval = setInterval(() => {
      this.sendFrame();
    }, intervalMs);
  }

  private sendFrame(): void {
    if (!this.socket?.connected || !this.currentAttemptId || !this.currentExamId) {
      return;
    }

    const frame = this.getFrameCallback?.();
    if (frame) {
      this.socket.emit('studentFrame', {
        attemptId: this.currentAttemptId,
        examId: this.currentExamId,
        frame,
        timestamp: new Date().toISOString(),
      });
    }
  }

  stopFrameStreaming(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    this.getFrameCallback = null;
  }

  // Report student activity to proctors
  reportActivity(type: string, metadata?: Record<string, any>): void {
    if (!this.socket?.connected || !this.currentAttemptId || !this.currentExamId) {
      return;
    }

    this.socket.emit('studentActivity', {
      attemptId: this.currentAttemptId,
      examId: this.currentExamId,
      type,
      metadata,
    });
  }

  // Send verification result
  sendVerificationResult(isVerified: boolean, matchScore: number): void {
    if (!this.socket?.connected || !this.currentAttemptId || !this.currentExamId) {
      return;
    }

    this.socket.emit('verificationResult', {
      attemptId: this.currentAttemptId,
      examId: this.currentExamId,
      isVerified,
      matchScore,
    });
  }

  // Event subscription methods
  onVerificationRequest(callback: EventCallback<VerificationRequest>): () => void {
    this.onVerificationRequestCallbacks.push(callback);
    return () => {
      this.onVerificationRequestCallbacks = this.onVerificationRequestCallbacks.filter(
        cb => cb !== callback
      );
    };
  }

  onManualVerification(callback: EventCallback<ManualVerificationUpdate>): () => void {
    this.onManualVerificationCallbacks.push(callback);
    return () => {
      this.onManualVerificationCallbacks = this.onManualVerificationCallbacks.filter(
        cb => cb !== callback
      );
    };
  }

  onDisconnect(callback: EventCallback<void>): () => void {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect(): void {
    this.leaveExam();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear callbacks
    this.onVerificationRequestCallbacks = [];
    this.onManualVerificationCallbacks = [];
    this.onDisconnectCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  getAttemptId(): string | null {
    return this.currentAttemptId;
  }

  getExamId(): string | null {
    return this.currentExamId;
  }
}

// Export singleton instance
export const studentSocket = new StudentSocketService();
export default studentSocket;
