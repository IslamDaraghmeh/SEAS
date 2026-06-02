import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import {
  VerificationResult,
  VerificationAlert,
  ManualVerification,
  monitoringSocket,
} from '../../services/monitoring.socket';
import verificationService from '../../services/verification.service';
import { format, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface VerificationAlertPanelProps {
  examId: string;
  isConnected: boolean;
}

interface AlertWithImage extends VerificationAlert {
  id: string;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  approved?: boolean;
}

const VerificationAlertPanel: React.FC<VerificationAlertPanelProps> = ({
  examId,
  isConnected,
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;
  const [alerts, setAlerts] = useState<AlertWithImage[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertWithImage | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to verification events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Listen for verification alerts (failed verifications)
    unsubscribers.push(
      monitoringSocket.onVerificationAlert((data: VerificationAlert) => {
        const newAlert: AlertWithImage = {
          ...data,
          id: data.verificationId,
          isReviewed: false,
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50 alerts

        // Play alert sound for high severity
        if (data.severity === 'high') {
          playAlertSound();
        }
      })
    );

    // Listen for manual verification updates
    unsubscribers.push(
      monitoringSocket.onManualVerification((data: ManualVerification) => {
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === data.verificationLogId
              ? {
                  ...alert,
                  isReviewed: true,
                  reviewedBy: data.verifiedBy,
                  reviewedAt: data.timestamp,
                  approved: data.approved,
                }
              : alert
          )
        );
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected]);

  const playAlertSound = () => {
    try {
      const audio = new Audio('/sounds/alert.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch {
      // Ignore audio errors
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (!isValid(date)) return '-';
    return format(date, 'HH:mm:ss', { locale });
  };

  const formatFullTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (!isValid(date)) return '-';
    return format(date, 'PPpp', { locale });
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const handleReview = useCallback((alert: AlertWithImage) => {
    setSelectedAlert(alert);
    setIsReviewModalOpen(true);
    setReviewNotes('');
  }, []);

  const handleManualVerification = async (approved: boolean) => {
    if (!selectedAlert) return;

    setIsSubmitting(true);
    try {
      await verificationService.manuallyVerify(
        selectedAlert.verificationId,
        approved,
        reviewNotes || undefined
      );

      // Update local state
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === selectedAlert.id
            ? {
                ...alert,
                isReviewed: true,
                approved,
              }
            : alert
        )
      );

      toast.success(
        approved
          ? t('verification.manuallyApproved') || 'Verification approved'
          : t('verification.manuallyRejected') || 'Verification rejected'
      );

      setIsReviewModalOpen(false);
      setSelectedAlert(null);
    } catch (error) {
      console.error('Manual verification error:', error);
      toast.error(t('common.error') || 'Failed to process verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unreviewedCount = alerts.filter(a => !a.isReviewed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          {t('verification.pendingReview') || 'Pending Verification Review'}
          {unreviewedCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              {unreviewedCount}
            </span>
          )}
        </h3>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            {t('verification.noAlertsToReview') || 'No verification alerts to review'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${
                  alert.isReviewed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Captured Image */}
                  <div className="flex-shrink-0">
                    {alert.capturedImage ? (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={alert.capturedImage.startsWith('data:')
                            ? alert.capturedImage
                            : `data:image/jpeg;base64,${alert.capturedImage}`}
                          alt="Captured"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleReview(alert)}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Alert Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {alert.studentName}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({alert.studentNumber})
                          </span>
                        </div>
                        <p className={`text-sm ${styles.text} mt-1`}>
                          {alert.message}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles.badge}`}>
                        {Math.round(alert.matchScore * 100)}%
                      </span>
                    </div>

                    {/* Current Question (if available) */}
                    {alert.currentQuestion && (
                      <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                        <DocumentTextIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Q{alert.currentQuestion.order}: {alert.currentQuestion.text.substring(0, 80)}
                          {alert.currentQuestion.text.length > 80 ? '...' : ''}
                        </span>
                      </div>
                    )}

                    {/* Attempt Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      <span>{alert.attemptInfo.examTitle}</span>
                    </div>

                    {/* Actions */}
                    {alert.isReviewed ? (
                      <div className={`flex items-center gap-2 text-sm ${
                        alert.approved ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {alert.approved ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <XCircleIcon className="h-4 w-4" />
                        )}
                        {alert.approved
                          ? t('verification.approved') || 'Approved'
                          : t('verification.rejected') || 'Rejected'}
                        {alert.reviewedBy && (
                          <span className="text-gray-500">
                            by {alert.reviewedBy}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleReview(alert)}
                        >
                          {t('verification.review') || 'Review'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => {
                            setSelectedAlert(alert);
                            handleManualVerification(true);
                          }}
                          disabled={isSubmitting}
                        >
                          <CheckCircleIcon className="h-4 w-4 me-1" />
                          {t('verification.approve') || 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => {
                            setSelectedAlert(alert);
                            handleManualVerification(false);
                          }}
                          disabled={isSubmitting}
                        >
                          <XCircleIcon className="h-4 w-4 me-1" />
                          {t('verification.reject') || 'Reject'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAlert(null);
        }}
        title={t('verification.reviewVerification') || 'Review Verification'}
        size="lg"
      >
        {selectedAlert && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedAlert.studentName}
                </h4>
                <p className="text-sm text-gray-500">
                  {selectedAlert.studentNumber}
                </p>
              </div>
              <div className="ms-auto text-end">
                <p className="text-sm text-gray-500">
                  {t('verification.matchScore') || 'Match Score'}
                </p>
                <p className={`text-lg font-bold ${
                  selectedAlert.matchScore >= 0.6 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.round(selectedAlert.matchScore * 100)}%
                </p>
              </div>
            </div>

            {/* Captured Image - Large */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {t('verification.capturedImage') || 'Captured Image'}
              </h5>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {selectedAlert.capturedImage ? (
                  <img
                    src={selectedAlert.capturedImage.startsWith('data:')
                      ? selectedAlert.capturedImage
                      : `data:image/jpeg;base64,${selectedAlert.capturedImage}`}
                    alt="Captured"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-16 w-16 text-gray-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Current Question */}
            {selectedAlert.currentQuestion && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  {t('exam.currentQuestion') || 'Current Question'} (#{selectedAlert.currentQuestion.order})
                </h5>
                <p className="text-sm text-blue-700">
                  {selectedAlert.currentQuestion.text}
                </p>
              </div>
            )}

            {/* Alert Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('common.time')}:</span>
                <span className="ms-2 text-gray-900">
                  {formatFullTimestamp(selectedAlert.timestamp)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('exam.exam')}:</span>
                <span className="ms-2 text-gray-900">
                  {selectedAlert.attemptInfo.examTitle}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('common.severity')}:</span>
                <span className={`ms-2 px-2 py-0.5 rounded text-xs font-medium ${
                  getSeverityStyles(selectedAlert.severity).badge
                }`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('common.type')}:</span>
                <span className="ms-2 text-gray-900">
                  {selectedAlert.type}
                </span>
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('verification.reviewNotes') || 'Notes (Optional)'}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t('verification.enterReviewNotes') || 'Enter any notes about this verification...'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setSelectedAlert(null);
                }}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleManualVerification(false)}
                disabled={isSubmitting}
                leftIcon={<XCircleIcon className="h-5 w-5" />}
              >
                {isSubmitting ? t('common.processing') : t('verification.reject') || 'Reject'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleManualVerification(true)}
                disabled={isSubmitting}
                leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              >
                {isSubmitting ? t('common.processing') : t('verification.approve') || 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VerificationAlertPanel;
