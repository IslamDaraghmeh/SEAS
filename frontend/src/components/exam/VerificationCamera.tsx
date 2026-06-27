import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CameraIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BellAlertIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { useCamera } from '../../hooks/useCamera';
import Button from '../ui/Button';
import { verificationService } from '../../services/verification.service';
import { studentSocket, VerificationRequest } from '../../services/student.socket';

interface VerificationResult {
  isVerified: boolean;
  matchScore: number;
  livenessScore?: number;
}

interface VerificationCameraProps {
  examId?: string;
  attemptId?: string;
  onVerificationComplete?: (success: boolean, result?: VerificationResult) => void;
  onVerificationError?: (error: string) => void;
  autoVerify?: boolean;
  verificationInterval?: number; // in seconds
  showPreview?: boolean;
  enableStreaming?: boolean; // Enable camera streaming to proctors
  streamInterval?: number; // Frame streaming interval in ms
  showFaceDetectionFeedback?: boolean; // Enable real-time face detection feedback
  faceDetectionInterval?: number; // Face detection check interval in ms
  enableAutoRetry?: boolean; // Enable auto-retry on network failures
  maxRetries?: number; // Max retry attempts
}

type VerificationStatus = 'idle' | 'capturing' | 'verifying' | 'success' | 'failed' | 'requested';

interface FaceDetectionState {
  faceDetected: boolean;
  facesCount: number;
  issues: string[];
  lastCheck: number;
}

const VerificationCamera: React.FC<VerificationCameraProps> = ({
  examId,
  attemptId,
  onVerificationComplete,
  onVerificationError,
  autoVerify = false,
  verificationInterval = 300, // 5 minutes default
  showPreview = true,
  enableStreaming = true,
  streamInterval = 3000, // 3 seconds default
  showFaceDetectionFeedback = true,
  faceDetectionInterval = 1500, // 1.5 seconds default
  enableAutoRetry = true,
  maxRetries = 3,
}) => {
  const { t } = useTranslation();
  const {
    videoRef,
    canvasRef,
    isLoading: cameraLoading,
    error: cameraError,
    isActive,
    hasPermission,
    startCamera,
    stopCamera,
    takePhoto,
  } = useCamera({ autoStart: true });

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [proctorRequest, setProctorRequest] = useState<VerificationRequest | null>(null);
  const [requestCountdown, setRequestCountdown] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const autoVerifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Face detection state for real-time feedback
  const [faceDetection, setFaceDetection] = useState<FaceDetectionState>({
    faceDetected: false,
    facesCount: 0,
    issues: [],
    lastCheck: 0,
  });
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingFaceRef = useRef(false);

  // Handle verification
  const handleVerify = useCallback(async () => {
    if (!isActive) {
      setMessage(t('verification.cameraRequired'));
      return;
    }

    setStatus('capturing');
    setMessage(t('verification.holdStill'));

    // Capture photo
    const photo = takePhoto();
    if (!photo) {
      setStatus('failed');
      setMessage(t('verification.verificationFailed'));
      return;
    }

    if (showPreview) {
      setCapturedImage(photo);
    }

    setStatus('verifying');
    setMessage(t('verification.verifying'));

    try {
      // Use attemptId for verification (required by backend)
      if (!attemptId) {
        setStatus('failed');
        setMessage(t('verification.verificationFailed') || 'No exam attempt');
        return;
      }
      const result = await verificationService.verifyFace(attemptId, photo);

      if (result.verified) {
        setStatus('success');
        setMessage(t('verification.verified'));
        setConfidence(result.confidence);
        onVerificationComplete?.(true, {
          isVerified: true,
          matchScore: result.confidence,
          livenessScore: result.livenessScore,
        });

        // Send verification result to proctors
        studentSocket.sendVerificationResult(true, result.confidence);
      } else {
        setStatus('failed');
        setMessage(result.message || t('verification.verificationFailed'));
        onVerificationComplete?.(false, {
          isVerified: false,
          matchScore: result.confidence || 0,
        });

        // Send verification result to proctors
        studentSocket.sendVerificationResult(false, result.confidence || 0);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('verification.verificationFailed');

      // Check if it's a network error and auto-retry is enabled
      const isNetworkError = error instanceof Error && (
        error.message.includes('network') ||
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')
      );

      if (enableAutoRetry && isNetworkError && retryCount < maxRetries) {
        // Calculate exponential backoff delay (2^retryCount seconds, max 8 seconds)
        const delay = Math.min(Math.pow(2, retryCount) * 1000, 8000);
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        setStatus('idle');
        setMessage(t('verification.retrying') || `Retrying in ${delay / 1000} seconds... (${newRetryCount}/${maxRetries})`);

        // Start countdown
        setRetryCountdown(Math.ceil(delay / 1000));
        const countdownInterval = setInterval(() => {
          setRetryCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          clearInterval(countdownInterval);
          handleVerify();
        }, delay);

        return;
      }

      setStatus('failed');
      setMessage(errorMessage);
      setRetryCount(0);
      onVerificationError?.(errorMessage);

      // Send failure to proctors
      studentSocket.sendVerificationResult(false, 0);
    }

    // Clear proctor request if this was a response to it
    if (proctorRequest) {
      setProctorRequest(null);
    }

    // Reset status after delay
    setTimeout(() => {
      setStatus('idle');
      setCapturedImage(null);
    }, 3000);
  }, [isActive, takePhoto, showPreview, attemptId, onVerificationComplete, onVerificationError, t, proctorRequest]);

  // Get frame for streaming
  const getFrame = useCallback((): string | null => {
    if (!isActive) return null;
    return takePhoto();
  }, [isActive, takePhoto]);

  // Check face detection for real-time feedback
  const checkFaceDetection = useCallback(async () => {
    if (!isActive || isCheckingFaceRef.current || status !== 'idle') return;

    const photo = takePhoto();
    if (!photo) return;

    isCheckingFaceRef.current = true;

    try {
      const result = await verificationService.detectFace(photo);
      setFaceDetection({
        faceDetected: result.faceDetected,
        facesCount: result.facesCount,
        issues: result.issues,
        lastCheck: Date.now(),
      });
    } catch (error) {
      console.error('Face detection check error:', error);
    } finally {
      isCheckingFaceRef.current = false;
    }
  }, [isActive, takePhoto, status]);

  // Get instruction message based on face detection issues
  const getInstructionMessage = useCallback((): { message: string; icon: React.ReactNode; type: 'warning' | 'error' | 'success' } | null => {
    if (status !== 'idle' || !showFaceDetectionFeedback) return null;

    const { faceDetected, facesCount, issues } = faceDetection;

    if (!faceDetected || issues.includes('no_face')) {
      return {
        message: t('verification.faceNotDetected') || 'Position your face in the frame',
        icon: <UserCircleIcon className="h-6 w-6" />,
        type: 'error',
      };
    }

    if (facesCount > 1 || issues.includes('multiple_faces')) {
      return {
        message: t('verification.multipleFaces') || 'Only one person should be in the frame',
        icon: <ExclamationTriangleIcon className="h-6 w-6" />,
        type: 'error',
      };
    }

    if (issues.includes('move_closer')) {
      return {
        message: t('verification.moveCloser') || 'Move closer to the camera',
        icon: <ArrowUpIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('move_back')) {
      return {
        message: t('verification.moveBack') || 'Move back from the camera',
        icon: <ArrowDownIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('move_left')) {
      return {
        message: t('verification.moveLeft') || 'Move slightly to the left',
        icon: <ArrowLeftIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('move_right')) {
      return {
        message: t('verification.moveRight') || 'Move slightly to the right',
        icon: <ArrowRightIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('move_up')) {
      return {
        message: t('verification.moveUp') || 'Move the camera up',
        icon: <ArrowUpIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('move_down')) {
      return {
        message: t('verification.moveDown') || 'Move the camera down',
        icon: <ArrowDownIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    if (issues.includes('low_confidence')) {
      return {
        message: t('verification.improveLighting') || 'Improve lighting conditions',
        icon: <SunIcon className="h-6 w-6" />,
        type: 'warning',
      };
    }

    // Face detected and no issues
    if (faceDetected && issues.length === 0) {
      return {
        message: t('verification.facePositioned') || 'Face detected - Ready for verification',
        icon: <CheckCircleIcon className="h-6 w-6" />,
        type: 'success',
      };
    }

    return null;
  }, [status, showFaceDetectionFeedback, faceDetection, t]);

  // Set up periodic face detection checks
  useEffect(() => {
    if (!showFaceDetectionFeedback || !isActive) {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkFaceDetection();

    // Set up interval for periodic checks
    faceDetectionIntervalRef.current = setInterval(() => {
      checkFaceDetection();
    }, faceDetectionInterval);

    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    };
  }, [showFaceDetectionFeedback, isActive, faceDetectionInterval, checkFaceDetection]);

  // Set up frame streaming when camera is active
  useEffect(() => {
    if (!enableStreaming || !isActive || !attemptId) return;

    // Start streaming frames to proctors
    studentSocket.startFrameStreaming(getFrame, streamInterval);

    return () => {
      studentSocket.stopFrameStreaming();
    };
  }, [enableStreaming, isActive, attemptId, streamInterval, getFrame]);

  // Listen for proctor verification requests
  useEffect(() => {
    const unsubscribe = studentSocket.onVerificationRequest((request) => {
      console.log('Proctor requested verification:', request);
      setProctorRequest(request);
      setStatus('requested');
      setMessage(t('monitoring.verificationRequested') || 'Verification requested by proctor');

      // Start countdown
      setRequestCountdown(15);
    });

    return () => {
      unsubscribe();
    };
  }, [t]);

  // Handle request countdown
  useEffect(() => {
    if (requestCountdown <= 0 || !proctorRequest) return;

    const timer = setInterval(() => {
      setRequestCountdown(prev => {
        if (prev <= 1) {
          // Auto-verify when countdown reaches 0
          handleVerify();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [requestCountdown, proctorRequest, handleVerify]);

  // Auto verification interval
  useEffect(() => {
    if (!autoVerify || !isActive || !attemptId) return;

    // Initial verification after a short delay
    autoVerifyTimeoutRef.current = setTimeout(() => {
      handleVerify();
    }, 5000);

    // Set up interval for periodic verification
    const interval = setInterval(() => {
      // Only auto-verify if not in the middle of another verification
      if (status === 'idle') {
        handleVerify();
      }
    }, verificationInterval * 1000);

    return () => {
      clearInterval(interval);
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
      }
    };
  }, [autoVerify, isActive, attemptId, verificationInterval, status, handleVerify]);

  // Handle retry
  const handleRetry = () => {
    // Cancel any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setCapturedImage(null);
    setStatus('idle');
    setMessage('');
    setProctorRequest(null);
    setRequestCountdown(0);
    setRetryCount(0);
    setRetryCountdown(0);
  };

  // Status icon component
  const StatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-12 w-12 text-red-500" />;
      case 'requested':
        return <BellAlertIcon className="h-12 w-12 text-yellow-500 animate-bounce" />;
      case 'verifying':
      case 'capturing':
        return <ArrowPathIcon className="h-12 w-12 text-primary-500 animate-spin" />;
      default:
        return null;
    }
  };

  // Render camera permission denied state
  if (hasPermission === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">
          {t('verification.cameraAccess')}
        </h3>
        <p className="text-sm text-red-600 mb-4">
          {t('verification.cameraRequired')}
        </p>
        <Button onClick={startCamera} variant="primary">
          {t('verification.enableCamera')}
        </Button>
      </div>
    );
  }

  // Render camera error state
  if (cameraError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          {t('verification.cameraAccess')}
        </h3>
        <p className="text-sm text-yellow-600 mb-4">{cameraError}</p>
        <Button onClick={startCamera} variant="primary">
          {t('errors.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CameraIcon className="h-5 w-5" />
          {t('verification.title')}
          {enableStreaming && isActive && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {t('monitoring.online') || 'Live'}
            </span>
          )}
        </h3>
      </div>

      {/* Camera View */}
      <div className="relative aspect-video bg-gray-900">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            capturedImage ? 'hidden' : 'block'
          }`}
        />

        {/* Captured Image Preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading Overlay */}
        {cameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <ArrowPathIcon className="h-10 w-10 text-white animate-spin" />
          </div>
        )}

        {/* Status Overlay */}
        {status !== 'idle' && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            status === 'requested' ? 'bg-yellow-900 bg-opacity-90' : 'bg-black bg-opacity-50'
          }`}>
            <StatusIcon />
            <p className="mt-3 text-white font-medium text-center px-4">{message}</p>
            {confidence !== null && status === 'success' && (
              <p className="text-sm text-green-300 mt-1">
                {Math.round(confidence * 100)}%
              </p>
            )}
            {status === 'requested' && requestCountdown > 0 && (
              <div className="mt-4">
                <p className="text-yellow-300 text-lg font-bold">
                  {t('verification.verifyingPose') || 'Verifying in'}: {requestCountdown}s
                </p>
                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={handleVerify}
                >
                  {t('verification.verify')} {t('common.now') || 'Now'}
                </Button>
              </div>
            )}
            {retryCountdown > 0 && (
              <div className="mt-4">
                <p className="text-blue-300 text-lg font-bold">
                  {t('verification.retrying') || 'Retrying in'}: {retryCountdown}s
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {t('verification.retryAttempt', { current: retryCount, max: maxRetries }) ||
                    `Attempt ${retryCount} of ${maxRetries}`}
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={handleRetry}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Face Guide Overlay */}
        {isActive && status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-48 h-64 border-2 border-dashed rounded-full transition-colors duration-300 ${
              faceDetection.faceDetected && faceDetection.issues.length === 0
                ? 'border-green-400 border-opacity-80'
                : faceDetection.faceDetected
                ? 'border-yellow-400 border-opacity-80'
                : 'border-white border-opacity-50'
            }`} />
          </div>
        )}

        {/* Real-time Face Detection Feedback */}
        {isActive && status === 'idle' && showFaceDetectionFeedback && (() => {
          const instruction = getInstructionMessage();
          if (!instruction) return null;

          const bgColor = instruction.type === 'success'
            ? 'bg-green-900 bg-opacity-90'
            : instruction.type === 'error'
            ? 'bg-red-900 bg-opacity-90'
            : 'bg-yellow-900 bg-opacity-90';

          const textColor = instruction.type === 'success'
            ? 'text-green-100'
            : instruction.type === 'error'
            ? 'text-red-100'
            : 'text-yellow-100';

          return (
            <div className={`absolute top-4 left-4 right-4 ${bgColor} rounded-lg px-4 py-2 flex items-center gap-3`}>
              <span className={textColor}>{instruction.icon}</span>
              <p className={`text-sm font-medium ${textColor}`}>{instruction.message}</p>
            </div>
          );
        })()}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isActive ? t('verification.lookAtCamera') : t('verification.enableCamera')}
        </p>
        <div className="flex gap-2">
          {status === 'failed' && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              {t('verification.retake')}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerify}
            isLoading={status === 'capturing' || status === 'verifying'}
            disabled={!isActive || status === 'success'}
          >
            {status === 'success'
              ? t('verification.verified')
              : t('verification.verify')}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            {t('verification.verificationWarning')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationCamera;
