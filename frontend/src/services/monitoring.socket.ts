import { io, Socket } from 'socket.io-client';

export interface StudentFrame {
  attemptId: string;
  frame: string; // Base64 image
  timestamp: string;
}

export interface StudentStatus {
  attemptId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  status: string;
  isOnline: boolean;
  lastVerification?: {
    isVerified: boolean;
    matchScore: number;
    timestamp: string;
  };
  alertCount: number;
  unresolvedAlerts: number;
  progress: number;
  timeRemaining: number;
}

export interface ExamMonitoringData {
  examId: string;
  examTitle: string;
  status: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  students: StudentStatus[];
}

export interface VerificationUpdate {
  attemptId: string;
  isVerified: boolean;
  matchScore: number;
  timestamp: string;
}

export interface VerificationResult {
  type: 'success' | 'failed';
  verificationId: string;
  attemptId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
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
    startedAt: string;
    examTitle: string;
  };
}

export interface VerificationAlert {
  severity: 'high' | 'medium' | 'low';
  type: string;
  verificationId: string;
  attemptId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  matchScore: number;
  timestamp: string;
  capturedImage: string;
  currentQuestion?: {
    id: string;
    text: string;
    order: number;
  };
  attemptInfo: {
    startedAt: string;
    examTitle: string;
  };
  message: string;
}

export interface ManualVerification {
  verificationLogId: string;
  attemptId: string;
  studentId: string;
  approved: boolean;
  verifiedBy: string;
  notes?: string;
  timestamp: string;
}

export interface NewAlert {
  examId: string;
  attemptId: string;
  alertId: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export interface StudentActivity {
  attemptId: string;
  type: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

type EventCallback<T> = (data: T) => void;

class MonitoringSocketService {
  private socket: Socket | null = null;
  private currentExamId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event listeners
  private onStudentFrameCallbacks: EventCallback<StudentFrame>[] = [];
  private onVerificationUpdateCallbacks: EventCallback<VerificationUpdate>[] = [];
  private onAlertCreatedCallbacks: EventCallback<NewAlert>[] = [];
  private onStudentOnlineCallbacks: EventCallback<{ attemptId: string; timestamp: string }>[] = [];
  private onStudentOfflineCallbacks: EventCallback<{ attemptId: string; timestamp: string }>[] = [];
  private onStudentActivityCallbacks: EventCallback<StudentActivity>[] = [];
  private onExamUpdateCallbacks: EventCallback<ExamMonitoringData>[] = [];
  private onStudentFlaggedCallbacks: EventCallback<{ attemptId: string; reason: string; flaggedBy: string; timestamp: string }>[] = [];
  private onVerificationRequestedCallbacks: EventCallback<{ attemptId: string; requestedBy: string; timestamp: string }>[] = [];
  // New verification event callbacks
  private onVerificationResultCallbacks: EventCallback<VerificationResult>[] = [];
  private onVerificationAlertCallbacks: EventCallback<VerificationAlert>[] = [];
  private onManualVerificationCallbacks: EventCallback<ManualVerification>[] = [];

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

      console.log('Connecting to monitoring WebSocket at:', `${baseUrl}/monitoring`);

      this.socket = io(`${baseUrl}/monitoring`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        // Add timeout for connection
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Monitoring socket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Monitoring socket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Monitoring socket disconnected:', reason);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('studentFrame', (data: StudentFrame) => {
      this.onStudentFrameCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('verificationUpdate', (data: VerificationUpdate) => {
      this.onVerificationUpdateCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('newAlert', (data: NewAlert) => {
      this.onAlertCreatedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('studentOnline', (data: { attemptId: string; timestamp: string }) => {
      this.onStudentOnlineCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('studentOffline', (data: { attemptId: string; timestamp: string }) => {
      this.onStudentOfflineCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('studentActivity', (data: StudentActivity) => {
      this.onStudentActivityCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('examUpdate', (data: ExamMonitoringData) => {
      this.onExamUpdateCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('studentFlagged', (data: { attemptId: string; reason: string; flaggedBy: string; timestamp: string }) => {
      this.onStudentFlaggedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('verificationRequested', (data: { attemptId: string; requestedBy: string; timestamp: string }) => {
      this.onVerificationRequestedCallbacks.forEach(cb => cb(data));
    });

    // New verification events
    this.socket.on('verificationResult', (data: VerificationResult) => {
      this.onVerificationResultCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('verificationAlert', (data: VerificationAlert) => {
      this.onVerificationAlertCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('manualVerification', (data: ManualVerification) => {
      this.onManualVerificationCallbacks.forEach(cb => cb(data));
    });
  }

  async joinExamRoom(examId: string): Promise<ExamMonitoringData | null> {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return null;
    }

    return new Promise((resolve) => {
      // Set timeout in case acknowledgement never comes
      const timeout = setTimeout(() => {
        console.error('joinExamRoom timeout - no response from server');
        resolve(null);
      }, 10000);

      this.socket!.emit('joinExamRoom', { examId }, (response: any) => {
        clearTimeout(timeout);
        console.log('joinExamRoom response:', response);

        if (response && response.success) {
          this.currentExamId = examId;
          resolve(response.data);
        } else {
          console.error('Failed to join exam room:', response?.error || 'Unknown error');
          resolve(null);
        }
      });
    });
  }

  leaveExamRoom(): void {
    if (!this.socket?.connected || !this.currentExamId) return;

    this.socket.emit('leaveExamRoom', { examId: this.currentExamId });
    this.currentExamId = null;
  }

  async requestVerification(attemptId: string): Promise<boolean> {
    if (!this.socket?.connected || !this.currentExamId) {
      console.error('Socket not connected or no exam room joined');
      return false;
    }

    return new Promise((resolve) => {
      this.socket!.emit('requestVerification', {
        attemptId,
        examId: this.currentExamId
      }, (response: any) => {
        resolve(response.success === true);
      });
    });
  }

  async flagStudent(attemptId: string, reason: string): Promise<boolean> {
    if (!this.socket?.connected || !this.currentExamId) {
      console.error('Socket not connected or no exam room joined');
      return false;
    }

    return new Promise((resolve) => {
      this.socket!.emit('flagStudent', {
        attemptId,
        examId: this.currentExamId,
        reason
      }, (response: any) => {
        resolve(response.success === true);
      });
    });
  }

  async getActiveStudents(): Promise<StudentStatus[]> {
    if (!this.socket?.connected || !this.currentExamId) {
      return [];
    }

    return new Promise((resolve) => {
      this.socket!.emit('getActiveStudents', { examId: this.currentExamId }, (response: any) => {
        if (response.success) {
          resolve(response.data || []);
        } else {
          resolve([]);
        }
      });
    });
  }

  async requestMonitoringUpdate(): Promise<ExamMonitoringData | null> {
    if (!this.socket?.connected || !this.currentExamId) {
      return null;
    }

    return new Promise((resolve) => {
      this.socket!.emit('requestMonitoringUpdate', { examId: this.currentExamId }, (response: any) => {
        if (response.success) {
          resolve(response.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Event subscription methods
  onStudentFrame(callback: EventCallback<StudentFrame>): () => void {
    this.onStudentFrameCallbacks.push(callback);
    return () => {
      this.onStudentFrameCallbacks = this.onStudentFrameCallbacks.filter(cb => cb !== callback);
    };
  }

  onVerificationUpdate(callback: EventCallback<VerificationUpdate>): () => void {
    this.onVerificationUpdateCallbacks.push(callback);
    return () => {
      this.onVerificationUpdateCallbacks = this.onVerificationUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  onAlertCreated(callback: EventCallback<NewAlert>): () => void {
    this.onAlertCreatedCallbacks.push(callback);
    return () => {
      this.onAlertCreatedCallbacks = this.onAlertCreatedCallbacks.filter(cb => cb !== callback);
    };
  }

  onStudentOnline(callback: EventCallback<{ attemptId: string; timestamp: string }>): () => void {
    this.onStudentOnlineCallbacks.push(callback);
    return () => {
      this.onStudentOnlineCallbacks = this.onStudentOnlineCallbacks.filter(cb => cb !== callback);
    };
  }

  onStudentOffline(callback: EventCallback<{ attemptId: string; timestamp: string }>): () => void {
    this.onStudentOfflineCallbacks.push(callback);
    return () => {
      this.onStudentOfflineCallbacks = this.onStudentOfflineCallbacks.filter(cb => cb !== callback);
    };
  }

  onStudentActivity(callback: EventCallback<StudentActivity>): () => void {
    this.onStudentActivityCallbacks.push(callback);
    return () => {
      this.onStudentActivityCallbacks = this.onStudentActivityCallbacks.filter(cb => cb !== callback);
    };
  }

  onExamUpdate(callback: EventCallback<ExamMonitoringData>): () => void {
    this.onExamUpdateCallbacks.push(callback);
    return () => {
      this.onExamUpdateCallbacks = this.onExamUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  onStudentFlagged(callback: EventCallback<{ attemptId: string; reason: string; flaggedBy: string; timestamp: string }>): () => void {
    this.onStudentFlaggedCallbacks.push(callback);
    return () => {
      this.onStudentFlaggedCallbacks = this.onStudentFlaggedCallbacks.filter(cb => cb !== callback);
    };
  }

  onVerificationRequested(callback: EventCallback<{ attemptId: string; requestedBy: string; timestamp: string }>): () => void {
    this.onVerificationRequestedCallbacks.push(callback);
    return () => {
      this.onVerificationRequestedCallbacks = this.onVerificationRequestedCallbacks.filter(cb => cb !== callback);
    };
  }

  // New verification event subscriptions
  onVerificationResult(callback: EventCallback<VerificationResult>): () => void {
    this.onVerificationResultCallbacks.push(callback);
    return () => {
      this.onVerificationResultCallbacks = this.onVerificationResultCallbacks.filter(cb => cb !== callback);
    };
  }

  onVerificationAlert(callback: EventCallback<VerificationAlert>): () => void {
    this.onVerificationAlertCallbacks.push(callback);
    return () => {
      this.onVerificationAlertCallbacks = this.onVerificationAlertCallbacks.filter(cb => cb !== callback);
    };
  }

  onManualVerification(callback: EventCallback<ManualVerification>): () => void {
    this.onManualVerificationCallbacks.push(callback);
    return () => {
      this.onManualVerificationCallbacks = this.onManualVerificationCallbacks.filter(cb => cb !== callback);
    };
  }

  disconnect(): void {
    if (this.currentExamId) {
      this.leaveExamRoom();
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear all callbacks
    this.onStudentFrameCallbacks = [];
    this.onVerificationUpdateCallbacks = [];
    this.onAlertCreatedCallbacks = [];
    this.onStudentOnlineCallbacks = [];
    this.onStudentOfflineCallbacks = [];
    this.onStudentActivityCallbacks = [];
    this.onExamUpdateCallbacks = [];
    this.onStudentFlaggedCallbacks = [];
    this.onVerificationRequestedCallbacks = [];
    this.onVerificationResultCallbacks = [];
    this.onVerificationAlertCallbacks = [];
    this.onManualVerificationCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected === true;
  }

  getCurrentExamId(): string | null {
    return this.currentExamId;
  }
}

// Export singleton instance
export const monitoringSocket = new MonitoringSocketService();
export default monitoringSocket;
