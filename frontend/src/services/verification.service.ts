import api from './api';

// Types
export interface VerificationResult {
  success?: boolean;
  verified: boolean;
  isVerified?: boolean;
  confidence: number;
  matchScore?: number;
  livenessScore?: number;
  message?: string;
  timestamp?: string;
}

export interface VerificationLog {
  id: string;
  examId: string;
  studentId: string;
  timestamp: string;
  verified: boolean;
  confidence: number;
  imageUrl?: string;
  alertType?: 'face_not_detected' | 'multiple_faces' | 'different_person' | 'poor_quality';
  notes?: string;
}

export interface VerificationSession {
  sessionId: string;
  attemptId: string;
  examId?: string;
  studentId: string;
  startedAt: string;
  verificationCount: number;
  failedCount: number;
  lastVerifiedAt?: string;
  status: 'active' | 'completed' | 'flagged';
}

export interface AlertData {
  examId: string;
  studentId: string;
  alertType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  imageData?: string;
}

// Challenge types for liveness verification
export type ChallengeType =
  | 'front_selfie'
  | 'turn_left'
  | 'turn_right'
  | 'nod'
  | 'blink'
  | 'lip_movement';

export interface ChallengeResult {
  success: boolean;
  challengeType: string;
  passed: boolean;
  confidence: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface LipMovementResult {
  success: boolean;
  movementDetected: boolean;
  confidence: number;
  marChange?: number;
  framesAnalyzed?: number;
}

export interface NodResult {
  success: boolean;
  nodDetected: boolean;
  pitchRange: number;
  confidence: number;
  framesAnalyzed?: number;
}

export interface BlinkResult {
  success: boolean;
  blinkDetected: boolean;
  blinkCount: number;
  confidence: number;
  minEar?: number;
}

/**
 * Verification service for handling face verification during exams
 */
export const verificationService = {
  /**
   * Register face for verification (initial setup) - single image
   */
  async registerFace(imageData: string): Promise<{
    success: boolean;
    faceId: string;
    message?: string;
  }> {
    const response = await api.post('/verification/register', {
      image: imageData,
    });
    return response.data;
  },

  /**
   * Register face with multiple images for better accuracy
   */
  async registerFaces(images: string[]): Promise<{
    success: boolean;
    facesEnrolled: number;
    message?: string;
  }> {
    const response = await api.post('/verification/register-multiple', {
      images: images,
    });
    return response.data;
  },

  /**
   * Verify pose during face registration
   */
  async verifyPose(image: string, expectedPose: string): Promise<{
    success: boolean;
    poseMatched: boolean;
    faceDetected: boolean;
    poseDirection: string;
    confidence: number;
    error?: string;
  }> {
    const response = await api.post('/verification/verify-pose', {
      image,
      expectedPose,
    });
    return response.data;
  },

  /**
   * Verify face during exam
   */
  async verifyFace(
    attemptId: string,
    imageData: string
  ): Promise<VerificationResult> {
    // Convert base64 to blob for file upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', blob, 'verification.jpg');
    formData.append('attemptId', attemptId);

    // Don't set Content-Type header - let axios set it automatically with boundary
    const response = await api.post<any>('/verification/verify', formData);

    // Normalize response - backend returns isVerified/matchScore, frontend expects verified/confidence
    const data = response.data;
    return {
      verified: data.isVerified ?? data.verified ?? false,
      isVerified: data.isVerified ?? data.verified ?? false,
      confidence: data.matchScore ?? data.confidence ?? 0,
      matchScore: data.matchScore ?? data.confidence ?? 0,
      livenessScore: data.livenessScore,
      message: data.message,
      timestamp: data.timestamp,
    };
  },

  /**
   * Start verification session for exam
   */
  async startSession(attemptId: string): Promise<VerificationSession> {
    const response = await api.post<VerificationSession>(
      `/verification/session/start`,
      { attemptId }
    );
    return response.data;
  },

  /**
   * End verification session
   */
  async endSession(sessionId: string): Promise<void> {
    await api.post(`/verification/session/${sessionId}/end`);
  },

  /**
   * Get verification session status
   */
  async getSessionStatus(sessionId: string): Promise<VerificationSession> {
    const response = await api.get<VerificationSession>(
      `/verification/session/${sessionId}`
    );
    return response.data;
  },

  /**
   * Report suspicious activity
   */
  async reportAlert(data: AlertData): Promise<void> {
    await api.post('/verification/alert', data);
  },

  /**
   * Get verification logs for an exam (teacher view)
   */
  async getExamVerificationLogs(
    examId: string,
    filters?: {
      studentId?: string;
      startTime?: string;
      endTime?: string;
      alertsOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    logs: VerificationLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get(`/verification/exam/${examId}/logs`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get student verification history
   */
  async getStudentVerificationHistory(
    studentId: string,
    examId?: string
  ): Promise<VerificationLog[]> {
    const response = await api.get<VerificationLog[]>(
      `/verification/student/${studentId}/history`,
      { params: { examId } }
    );
    return response.data;
  },

  /**
   * Get live verification stream data (for monitoring)
   */
  async getLiveVerifications(
    examId: string
  ): Promise<{
    activeStudents: number;
    recentVerifications: VerificationLog[];
    alerts: VerificationLog[];
  }> {
    const response = await api.get(`/verification/exam/${examId}/live`);
    return response.data;
  },

  /**
   * Clear alert (mark as reviewed)
   */
  async clearAlert(alertId: string, notes?: string): Promise<void> {
    await api.post(`/verification/alert/${alertId}/clear`, { notes });
  },

  /**
   * Flag student for review
   */
  async flagStudent(
    examId: string,
    studentId: string,
    reason: string
  ): Promise<void> {
    await api.post('/verification/flag', {
      examId,
      studentId,
      reason,
    });
  },

  /**
   * Get flagged students for exam
   */
  async getFlaggedStudents(
    examId: string
  ): Promise<
    {
      studentId: string;
      studentName: string;
      reason: string;
      flaggedAt: string;
      alertCount: number;
    }[]
  > {
    const response = await api.get(`/verification/exam/${examId}/flagged`);
    return response.data;
  },

  /**
   * Upload reference image for student
   */
  async uploadReferenceImage(file: File): Promise<{
    success: boolean;
    imageUrl: string;
    faceId: string;
  }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/verification/reference-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Check if student has registered face
   */
  async hasRegisteredFace(): Promise<{
    isRegistered: boolean;
    registeredAt?: string;
  }> {
    const response = await api.get('/verification/status');
    // Normalize response to expected format
    return {
      isRegistered: response.data.isRegistered || response.data.registered || false,
      registeredAt: response.data.registeredAt || response.data.lastUpdated,
    };
  },

  /**
   * Quick face detection check for real-time feedback
   * Returns face detection info without verification
   */
  async detectFace(imageData: string): Promise<{
    faceDetected: boolean;
    facesCount: number;
    faceBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    };
    imageWidth: number;
    imageHeight: number;
    issues: string[];
  }> {
    try {
      // Call the image-processing service for face detection
      const imageProcessingUrl = import.meta.env.VITE_IMAGE_PROCESSING_URL || 'http://localhost:8000';

      const response = await fetch(`${imageProcessingUrl}/face/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData.replace(/^data:image\/\w+;base64,/, ''),
          max_faces: 5,
          return_landmarks: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Face detection failed');
      }

      const data = await response.json();
      const issues: string[] = [];

      // Analyze face detection results
      if (data.faces_detected === 0) {
        issues.push('no_face');
      } else if (data.faces_detected > 1) {
        issues.push('multiple_faces');
      } else if (data.faces && data.faces.length > 0) {
        const face = data.faces[0];
        const imageWidth = data.image_width;
        const imageHeight = data.image_height;

        // Check if face is centered
        const faceCenterX = face.x + face.width / 2;
        const faceCenterY = face.y + face.height / 2;
        const imageCenterX = imageWidth / 2;
        const imageCenterY = imageHeight / 2;

        // Face should be within 25% of center
        const xOffset = Math.abs(faceCenterX - imageCenterX) / imageWidth;
        const yOffset = Math.abs(faceCenterY - imageCenterY) / imageHeight;

        if (xOffset > 0.25) {
          issues.push(faceCenterX < imageCenterX ? 'move_right' : 'move_left');
        }
        if (yOffset > 0.25) {
          issues.push(faceCenterY < imageCenterY ? 'move_down' : 'move_up');
        }

        // Check face size (should be 20-60% of image)
        const faceArea = (face.width * face.height) / (imageWidth * imageHeight);
        if (faceArea < 0.1) {
          issues.push('move_closer');
        } else if (faceArea > 0.7) {
          issues.push('move_back');
        }

        // Check confidence
        if (face.confidence < 0.7) {
          issues.push('low_confidence');
        }
      }

      return {
        faceDetected: data.faces_detected > 0,
        facesCount: data.faces_detected,
        faceBox: data.faces && data.faces.length > 0 ? data.faces[0] : undefined,
        imageWidth: data.image_width,
        imageHeight: data.image_height,
        issues,
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        faceDetected: false,
        facesCount: 0,
        imageWidth: 640,
        imageHeight: 480,
        issues: ['detection_error'],
      };
    }
  },

  /**
   * Delete registered face (Admin only)
   * Students cannot delete their own face registration
   */
  async adminDeleteFace(studentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/verification/face/${studentId}`);
    return response.data;
  },

  /**
   * Manually verify or reject a failed verification (Teacher/Admin only)
   */
  async manuallyVerify(
    verificationLogId: string,
    approved: boolean,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/verification/manual-verify/${verificationLogId}`, {
      approved,
      notes,
    });
    return response.data;
  },

  /**
   * Get verification log with captured image (Teacher/Admin only)
   */
  async getVerificationLogWithImage(verificationLogId: string): Promise<{
    id: string;
    attemptId: string;
    isVerified: boolean;
    matchScore: number;
    livenessScore: number;
    createdAt: string;
    capturedImage: string | null;
    student: {
      id: string;
      studentNumber: string;
      nameEn: string;
      nameAr: string;
    };
    exam: {
      id: string;
      titleEn: string;
      titleAr: string;
    };
  }> {
    const response = await api.get(`/verification/log/${verificationLogId}/image`);
    return response.data;
  },

  // ============= LIVENESS CHALLENGE VERIFICATION =============

  /**
   * Verify a generic liveness challenge
   */
  async verifyChallenge(
    challengeType: ChallengeType,
    images: string[],
    expectedDirection?: string
  ): Promise<ChallengeResult> {
    const response = await api.post<ChallengeResult>('/verification/verify-challenge', {
      challengeType,
      images,
      expectedDirection,
    });
    return response.data;
  },

  /**
   * Verify lip movement (say hello challenge)
   */
  async verifyLipMovement(images: string[]): Promise<LipMovementResult> {
    const response = await api.post<LipMovementResult>('/verification/verify-lip-movement', {
      images,
    });
    return response.data;
  },

  /**
   * Verify head nod
   */
  async verifyNod(images: string[]): Promise<NodResult> {
    const response = await api.post<NodResult>('/verification/verify-nod', {
      images,
    });
    return response.data;
  },

  /**
   * Verify eye blink
   */
  async verifyBlink(images: string[]): Promise<BlinkResult> {
    const response = await api.post<BlinkResult>('/verification/verify-blink', {
      images,
    });
    return response.data;
  },

  /**
   * Get verification history for a student
   */
  async getStudentHistory(studentId: string): Promise<{
    student: {
      id: string;
      studentNumber: string;
      nameAr: string;
      nameEn: string;
      faceRegistered: boolean;
    };
    attempts: unknown[];
  }> {
    const response = await api.get(`/verification/student/${studentId}/history`);
    return response.data;
  },

  // ============= ADMIN/TEACHER FACE REGISTRATION VIEW =============

  /**
   * Get face registration image for a specific student (Admin/Teacher only)
   */
  async getFaceRegistrationImage(studentId: string): Promise<{
    studentId: string;
    studentNumber: string;
    studentName: string;
    isRegistered: boolean;
    registeredAt: string | null;
    faceImage: string | null;
    challengeImages: Array<{ index: number; image: string }>;
    totalChallenges: number;
  }> {
    const response = await api.get(`/verification/face-image/${studentId}`);
    return response.data;
  },

  /**
   * Get face registration status for all students (Admin/Teacher only)
   */
  async getAllStudentsFaceStatus(): Promise<Array<{
    studentId: string;
    studentNumber: string;
    studentName: string;
    email: string;
    isActive: boolean;
    isRegistered: boolean;
    registeredAt: string | null;
  }>> {
    const response = await api.get('/verification/face-status/all');
    return response.data;
  },

  /**
   * Get verification status for an exam attempt (check if student has been verified)
   */
  async getVerificationStatus(attemptId: string): Promise<{
    isVerified: boolean;
    matchScore: number | null;
    verifiedAt: string | null;
  }> {
    try {
      const response = await api.get(`/verification/attempt/${attemptId}/status`);
      return response.data;
    } catch {
      // If endpoint doesn't exist or returns error, assume not verified
      return { isVerified: false, matchScore: null, verifiedAt: null };
    }
  },
};

export default verificationService;
