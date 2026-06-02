import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ExamTimerProps {
  duration: number; // Duration in minutes
  startTime?: Date;
  onTimeUp?: () => void;
  onWarning?: (minutesLeft: number) => void;
  warningThreshold?: number; // Minutes before warning
}

const ExamTimer: React.FC<ExamTimerProps> = ({
  duration,
  startTime = new Date(),
  onTimeUp,
  onWarning,
  warningThreshold = 5,
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate initial time left based on start time
  useEffect(() => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const remaining = Math.max(0, duration * 60 - elapsed);
    setTimeLeft(remaining);
  }, [duration, startTime]);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        // Check for warning threshold
        if (newTime === warningThreshold * 60 && onWarning) {
          onWarning(warningThreshold);
        }

        // Check for time up
        if (newTime <= 0) {
          clearInterval(timer);
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeLeft, warningThreshold, onWarning, onTimeUp]);

  // Set warning state
  useEffect(() => {
    setIsWarning(timeLeft <= warningThreshold * 60 && timeLeft > 0);
  }, [timeLeft, warningThreshold]);

  // Calculate progress percentage
  const progressPercentage = (timeLeft / (duration * 60)) * 100;

  return (
    <div
      className={`rounded-lg border-2 p-4 ${
        isWarning
          ? 'border-red-300 bg-red-50'
          : timeLeft <= 0
          ? 'border-gray-300 bg-gray-50'
          : 'border-primary-200 bg-primary-50'
      }`}
    >
      {/* Timer Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWarning ? (
            <ExclamationTriangleIcon
              className={`h-6 w-6 ${
                isWarning ? 'text-red-600 animate-pulse' : 'text-primary-600'
              }`}
            />
          ) : (
            <ClockIcon className="h-6 w-6 text-primary-600" />
          )}
          <span className="text-sm font-medium text-gray-600">
            {t('exam.timeRemaining')}
          </span>
        </div>
      </div>

      {/* Time Display */}
      <div
        className={`text-3xl font-bold text-center mb-3 font-mono ${
          isWarning ? 'text-red-600' : timeLeft <= 0 ? 'text-gray-400' : 'text-primary-700'
        }`}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isWarning
              ? 'bg-red-500'
              : progressPercentage > 50
              ? 'bg-primary-500'
              : progressPercentage > 25
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Warning Message */}
      {isWarning && (
        <p className="mt-3 text-sm text-red-600 text-center font-medium animate-pulse">
          {t('exam.timeRemaining')}: {Math.ceil(timeLeft / 60)} {t('exam.minutes')}
        </p>
      )}

      {/* Time Up Message */}
      {timeLeft <= 0 && (
        <p className="mt-3 text-sm text-gray-600 text-center font-medium">
          {t('exam.examEnded')}
        </p>
      )}
    </div>
  );
};

// Compact Timer variant for header
interface CompactTimerProps {
  timeLeft: number; // in seconds
  isWarning?: boolean;
}

export const CompactTimer: React.FC<CompactTimerProps> = ({
  timeLeft,
  isWarning = false,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        isWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      <ClockIcon className={`h-5 w-5 ${isWarning ? 'animate-pulse' : ''}`} />
      <span className={`font-mono font-bold ${isWarning ? 'animate-pulse' : ''}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default ExamTimer;
