import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  FlagIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { StudentStatus, StudentFrame, monitoringSocket } from '../../services/monitoring.socket';
import { format, isValid } from 'date-fns';

interface StudentMonitoringModalProps {
  student: StudentStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestVerification: (attemptId: string) => void;
  onFlagStudent: (attemptId: string, reason: string) => void;
}

const StudentMonitoringModal: React.FC<StudentMonitoringModalProps> = ({
  student,
  isOpen,
  onClose,
  onRequestVerification,
  onFlagStudent,
}) => {
  const { t } = useTranslation();
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Subscribe to student frames
  useEffect(() => {
    if (!student) return;

    const unsubscribe = monitoringSocket.onStudentFrame((data: StudentFrame) => {
      if (data.attemptId === student.attemptId) {
        setCurrentFrame(data.frame);
      }
    });

    return () => {
      unsubscribe();
      setCurrentFrame(null);
    };
  }, [student?.attemptId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowFlagInput(false);
      setFlagReason('');
      setCurrentFrame(null);
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    if (!isValid(date)) return '-';
    return format(date, 'HH:mm:ss');
  };

  const handleFlag = () => {
    if (flagReason.trim()) {
      onFlagStudent(student.attemptId, flagReason.trim());
      setShowFlagInput(false);
      setFlagReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                student.isOnline ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {student.isOnline ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {student.studentName}
                </h2>
                <p className="text-sm text-gray-500">
                  {student.studentNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Camera Feed */}
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {currentFrame ? (
                  <img
                    src={currentFrame}
                    alt={student.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {student.isOnline ? (
                      <div className="text-center">
                        <VideoCameraIcon className="h-16 w-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">
                          {t('monitoring.cameraFeedUnavailable') || 'Camera feed unavailable'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('monitoring.waitingForStream') || 'Waiting for video stream...'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircleIcon className="h-16 w-16 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">
                          {t('monitoring.studentOffline') || 'Student is offline'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    student.isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      student.isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'
                    }`} />
                    {student.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {student.unresolvedAlerts > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {student.unresolvedAlerts} {t('monitoring.alerts') || 'Alerts'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => onRequestVerification(student.attemptId)}
                  disabled={!student.isOnline}
                  leftIcon={<EyeIcon className="h-5 w-5" />}
                >
                  {t('monitoring.requestVerification') || 'Request Verification'}
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => setShowFlagInput(true)}
                  leftIcon={<FlagIcon className="h-5 w-5" />}
                >
                  {t('monitoring.flagStudent') || 'Flag Student'}
                </Button>
              </div>

              {/* Flag Input */}
              {showFlagInput && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-red-800 mb-2">
                    {t('monitoring.flagReason') || 'Reason for flagging'}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={2}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder={t('monitoring.enterFlagReason') || 'Enter the reason...'}
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowFlagInput(false);
                        setFlagReason('');
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleFlag}
                      disabled={!flagReason.trim()}
                    >
                      {t('monitoring.flagStudent') || 'Flag'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Student Info Panel */}
            <div className="space-y-4">
              {/* Verification Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  {t('verification.title') || 'Verification Status'}
                </h3>
                {student.lastVerification ? (
                  <div className={`p-3 rounded-lg ${
                    student.lastVerification.isVerified
                      ? 'bg-green-100 border border-green-200'
                      : 'bg-red-100 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        student.lastVerification.isVerified ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {student.lastVerification.isVerified
                          ? t('verification.verified') || 'Verified'
                          : t('verification.verificationFailed') || 'Failed'}
                      </span>
                      <span className={`text-lg font-bold ${
                        student.lastVerification.isVerified ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {Math.round(student.lastVerification.matchScore * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('common.time')}: {formatTimestamp(student.lastVerification.timestamp)}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      {t('verification.pending') || 'Pending verification'}
                    </p>
                  </div>
                )}
              </div>

              {/* Exam Progress */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  {t('verification.progress') || 'Exam Progress'}
                </h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {t('exam.completed') || 'Completed'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {student.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Time Remaining */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  {t('exam.timeRemaining') || 'Time Remaining'}
                </h3>
                <p className={`text-2xl font-bold ${
                  student.timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTimeRemaining(student.timeRemaining)}
                </p>
                {student.timeRemaining < 300 && (
                  <p className="text-xs text-red-500 mt-1">
                    {t('exam.timeLow') || 'Less than 5 minutes remaining'}
                  </p>
                )}
              </div>

              {/* Alerts Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {t('monitoring.alerts') || 'Alerts'}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('common.total') || 'Total'}</span>
                  <span className="font-medium text-gray-900">{student.alertCount}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">{t('common.pending') || 'Unresolved'}</span>
                  <span className={`font-medium ${
                    student.unresolvedAlerts > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {student.unresolvedAlerts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMonitoringModal;
