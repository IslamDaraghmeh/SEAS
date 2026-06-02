import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  VideoCameraIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  FlagIcon,
  EyeIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { StudentStatus, StudentFrame, monitoringSocket } from '../../services/monitoring.socket';

type GridSize = 'compact' | 'medium' | 'large';

interface LiveCameraGridProps {
  students: StudentStatus[];
  onRequestVerification: (attemptId: string) => void;
  onFlagStudent: (attemptId: string, reason: string) => void;
  onSelectStudent: (student: StudentStatus) => void;
}

const LiveCameraGrid: React.FC<LiveCameraGridProps> = ({
  students,
  onRequestVerification,
  onFlagStudent,
  onSelectStudent,
}) => {
  const { t } = useTranslation();
  const [frames, setFrames] = useState<Record<string, string>>({});
  const [flagModalStudent, setFlagModalStudent] = useState<StudentStatus | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>('compact');

  // Subscribe to student frames
  useEffect(() => {
    const unsubscribe = monitoringSocket.onStudentFrame((data: StudentFrame) => {
      setFrames(prev => ({
        ...prev,
        [data.attemptId]: data.frame,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (student: StudentStatus): string => {
    if (!student.isOnline) return 'border-gray-300 bg-gray-50';
    if (student.unresolvedAlerts > 0) return 'border-red-400 bg-red-50';
    if (student.lastVerification?.isVerified) return 'border-green-400 bg-green-50';
    return 'border-yellow-400 bg-yellow-50';
  };

  const getStatusIcon = (student: StudentStatus) => {
    if (!student.isOnline) {
      return <XCircleIcon className="h-4 w-4 text-gray-400" />;
    }
    if (student.unresolvedAlerts > 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }
    if (student.lastVerification?.isVerified) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    return <ShieldCheckIcon className="h-4 w-4 text-yellow-500" />;
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFlagSubmit = () => {
    if (flagModalStudent && flagReason.trim()) {
      onFlagStudent(flagModalStudent.attemptId, flagReason.trim());
      setFlagModalStudent(null);
      setFlagReason('');
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('monitoring.noActiveStudents') || 'No active students'}
        </h3>
        <p className="text-gray-500">
          {t('monitoring.waitingForStudents') || 'Waiting for students to join the exam'}
        </p>
      </div>
    );
  }

  // Calculate grid columns based on grid size setting
  const getGridCols = () => {
    switch (gridSize) {
      case 'compact':
        // Maximum density - fit as many students as possible
        return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12';
      case 'medium':
        if (students.length <= 4) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';
      case 'large':
        if (students.length <= 2) return 'grid-cols-1 sm:grid-cols-2';
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
    }
  };

  // Get aspect ratio based on grid size
  const getAspectRatio = () => {
    switch (gridSize) {
      case 'compact':
        return 'aspect-square'; // 1:1 for compact
      case 'medium':
        return 'aspect-[4/3]'; // 4:3 for medium
      case 'large':
        return 'aspect-video'; // 16:9 for large
      default:
        return 'aspect-square';
    }
  };

  // Render compact card - tiny thumbnail with overlay info
  const renderCompactCard = (student: StudentStatus) => (
    <div
      key={student.attemptId}
      className={`relative rounded overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-105 border ${getStatusColor(student)}`}
      onClick={() => onSelectStudent(student)}
      title={`${student.studentName} (${student.studentNumber})`}
    >
      {/* Camera Feed - Square aspect, tiny */}
      <div className="aspect-square bg-gray-800 relative">
        {frames[student.attemptId] ? (
          <img
            src={frames[student.attemptId]}
            alt={student.studentName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {student.isOnline ? (
              <VideoCameraIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-gray-500" />
            )}
          </div>
        )}

        {/* Overlay indicators */}
        {/* Online dot - top left */}
        <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full ${
          student.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
        }`} />

        {/* Alert badge - top right */}
        {student.unresolvedAlerts > 0 && (
          <div className="absolute top-0 right-0 bg-red-500 text-white min-w-[12px] h-3 rounded-bl text-[8px] font-bold flex items-center justify-center px-0.5">
            {student.unresolvedAlerts}
          </div>
        )}

        {/* Verification icon - bottom right */}
        {student.lastVerification && (
          <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full flex items-center justify-center ${
            student.lastVerification.isVerified ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {student.lastVerification.isVerified ? (
              <CheckCircleIcon className="h-2 w-2 text-white" />
            ) : (
              <XCircleIcon className="h-2 w-2 text-white" />
            )}
          </div>
        )}

        {/* Student number overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-0.5">
          <p className="text-[7px] text-white truncate text-center font-medium">
            {student.studentNumber}
          </p>
        </div>
      </div>
    </div>
  );

  // Render medium card - condensed info
  const renderMediumCard = (student: StudentStatus) => (
    <div
      key={student.attemptId}
      className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${getStatusColor(student)}`}
      onClick={() => onSelectStudent(student)}
    >
      {/* Camera Feed */}
      <div className={`${getAspectRatio()} bg-gray-900 relative`}>
        {frames[student.attemptId] ? (
          <img
            src={frames[student.attemptId]}
            alt={student.studentName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {student.isOnline ? (
              <VideoCameraIcon className="h-8 w-8 text-gray-600" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-gray-600" />
            )}
          </div>
        )}

        {/* Online indicator */}
        <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
          student.isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            student.isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'
          }`} />
          {student.isOnline ? 'ON' : 'OFF'}
        </div>

        {/* Alert badge */}
        {student.unresolvedAlerts > 0 && (
          <div className="absolute top-1.5 right-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
            {student.unresolvedAlerts}
          </div>
        )}

        {/* Verification badge */}
        {student.lastVerification && (
          <div className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            student.lastVerification.isVerified ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {Math.round(student.lastVerification.matchScore * 100)}%
          </div>
        )}
      </div>

      {/* Student Info - Condensed */}
      <div className="p-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          {getStatusIcon(student)}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {student.studentName}
            </p>
            <p className="text-[10px] text-gray-500">
              {student.studentNumber}
            </p>
          </div>
        </div>

        {/* Progress bar - minimal */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-1.5">
          <div
            className="bg-primary-600 h-1 rounded-full transition-all"
            style={{ width: `${student.progress}%` }}
          />
        </div>

        {/* Quick Actions - Icon only */}
        <div className="flex items-center gap-1">
          <button
            className="flex-1 p-1 text-gray-600 hover:bg-gray-100 rounded text-[10px] flex items-center justify-center gap-0.5 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onRequestVerification(student.attemptId);
            }}
            disabled={!student.isOnline}
            title={t('monitoring.requestVerification') || 'Request Verification'}
          >
            <EyeIcon className="h-3 w-3" />
          </button>
          <button
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setFlagModalStudent(student);
            }}
            title={t('monitoring.flagStudent') || 'Flag Student'}
          >
            <FlagIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Render large card (original full-featured)
  const renderLargeCard = (student: StudentStatus) => (
    <div
      key={student.attemptId}
      className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${getStatusColor(student)}`}
      onClick={() => onSelectStudent(student)}
    >
      {/* Camera Feed / Placeholder */}
      <div className={`${getAspectRatio()} bg-gray-900 relative`}>
        {frames[student.attemptId] ? (
          <img
            src={frames[student.attemptId]}
            alt={student.studentName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {student.isOnline ? (
              <div className="text-center">
                <VideoCameraIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {t('monitoring.cameraFeedUnavailable') || 'Camera feed unavailable'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <XCircleIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {t('monitoring.studentOffline') || 'Student offline'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Online/Offline indicator */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          student.isOnline ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            student.isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'
          }`} />
          {student.isOnline ? t('monitoring.online') || 'Online' : t('monitoring.offline') || 'Offline'}
        </div>

        {/* Alert badge */}
        {student.unresolvedAlerts > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            {student.unresolvedAlerts}
          </div>
        )}

        {/* Verification status */}
        {student.lastVerification && (
          <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
            student.lastVerification.isVerified
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {Math.round(student.lastVerification.matchScore * 100)}%
          </div>
        )}
      </div>

      {/* Student Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(student)}
            <div>
              <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">
                {student.studentName}
              </p>
              <p className="text-xs text-gray-500">
                {student.studentNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{t('verification.progress') || 'Progress'}</span>
            <span>{student.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all"
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>

        {/* Time remaining */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{t('exam.timeRemaining') || 'Time'}</span>
          <span className={`font-medium ${student.timeRemaining < 300 ? 'text-red-500' : ''}`}>
            {formatTimeRemaining(student.timeRemaining)}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRequestVerification(student.attemptId);
            }}
            disabled={!student.isOnline}
            title={t('monitoring.requestVerification') || 'Request Verification'}
          >
            <EyeIcon className="h-3 w-3 me-1" />
            {t('verification.verify') || 'Verify'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setFlagModalStudent(student);
            }}
            title={t('monitoring.flagStudent') || 'Flag Student'}
          >
            <FlagIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Get gap class based on grid size
  const getGapClass = () => {
    switch (gridSize) {
      case 'compact': return 'gap-1';
      case 'medium': return 'gap-2';
      case 'large': return 'gap-3';
      default: return 'gap-1';
    }
  };

  return (
    <>
      {/* Grid Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {students.length} {t('monitoring.activeStudents') || 'students'}
        </p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setGridSize('compact')}
            className={`p-1.5 rounded transition-colors ${
              gridSize === 'compact' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title={t('monitoring.compactView') || 'Compact View'}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setGridSize('medium')}
            className={`p-1.5 rounded transition-colors ${
              gridSize === 'medium' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title={t('monitoring.mediumView') || 'Medium View'}
          >
            <ViewColumnsIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setGridSize('large')}
            className={`p-1.5 rounded transition-colors ${
              gridSize === 'large' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            title={t('monitoring.largeView') || 'Large View'}
          >
            <VideoCameraIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid ${getGridCols()} ${getGapClass()}`}>
        {students.map((student) => {
          switch (gridSize) {
            case 'compact':
              return renderCompactCard(student);
            case 'medium':
              return renderMediumCard(student);
            case 'large':
              return renderLargeCard(student);
            default:
              return renderCompactCard(student);
          }
        })}
      </div>

      {/* Flag Student Modal */}
      <Modal
        isOpen={!!flagModalStudent}
        onClose={() => {
          setFlagModalStudent(null);
          setFlagReason('');
        }}
        title={t('monitoring.flagStudent') || 'Flag Student'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('monitoring.flagStudentMessage') || 'You are about to flag'}{' '}
            <strong>{flagModalStudent?.studentName}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('monitoring.flagReason') || 'Reason'}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder={t('monitoring.enterFlagReason') || 'Enter the reason for flagging...'}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFlagModalStudent(null);
                setFlagReason('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleFlagSubmit}
              disabled={!flagReason.trim()}
            >
              {t('monitoring.flagStudent') || 'Flag Student'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LiveCameraGrid;
