import { useEffect, useRef, useCallback, useState } from 'react';
import { studentSocket } from '../services/student.socket';

export interface TabDetectionOptions {
  enabled?: boolean;
  maxViolations?: number;
  onViolation?: (count: number) => void;
  onMaxViolationsReached?: () => void;
  reportToServer?: boolean;
  attemptId?: string;
}

export interface TabDetectionState {
  violationCount: number;
  isVisible: boolean;
  isFocused: boolean;
  lastViolationTime: number | null;
}

export function useTabDetection(options: TabDetectionOptions = {}) {
  const {
    enabled = true,
    maxViolations = 5,
    onViolation,
    onMaxViolationsReached,
    reportToServer = true,
    attemptId,
  } = options;

  const [state, setState] = useState<TabDetectionState>({
    violationCount: 0,
    isVisible: true,
    isFocused: true,
    lastViolationTime: null,
  });

  const violationCountRef = useRef(0);
  const wasVisibleRef = useRef(true);
  const wasFocusedRef = useRef(true);

  const handleViolation = useCallback(
    (type: 'visibility' | 'focus' | 'blur') => {
      violationCountRef.current += 1;
      const count = violationCountRef.current;

      setState((prev) => ({
        ...prev,
        violationCount: count,
        lastViolationTime: Date.now(),
        isVisible: type !== 'visibility' ? prev.isVisible : false,
        isFocused: type === 'focus',
      }));

      // Report to server via socket
      if (reportToServer && attemptId) {
        studentSocket.reportActivity('TAB_SWITCH', {
          type,
          count,
          timestamp: new Date().toISOString(),
        });
      }

      // Trigger callbacks
      onViolation?.(count);

      if (count >= maxViolations) {
        onMaxViolationsReached?.();
      }
    },
    [maxViolations, onViolation, onMaxViolationsReached, reportToServer, attemptId]
  );

  useEffect(() => {
    if (!enabled) return;

    // Handle visibility change
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';

      if (wasVisibleRef.current && !isVisible) {
        // Tab became hidden
        handleViolation('visibility');
      }

      wasVisibleRef.current = isVisible;
      setState((prev) => ({ ...prev, isVisible }));
    };

    // Handle window blur (user switched away)
    const handleBlur = () => {
      if (wasFocusedRef.current) {
        handleViolation('blur');
      }
      wasFocusedRef.current = false;
      setState((prev) => ({ ...prev, isFocused: false }));
    };

    // Handle window focus (user came back)
    const handleFocus = () => {
      wasFocusedRef.current = true;
      setState((prev) => ({ ...prev, isFocused: true }));
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Initialize state
    wasVisibleRef.current = document.visibilityState === 'visible';
    wasFocusedRef.current = document.hasFocus();
    setState((prev) => ({
      ...prev,
      isVisible: wasVisibleRef.current,
      isFocused: wasFocusedRef.current,
    }));

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, handleViolation]);

  const resetViolations = useCallback(() => {
    violationCountRef.current = 0;
    setState((prev) => ({
      ...prev,
      violationCount: 0,
      lastViolationTime: null,
    }));
  }, []);

  return {
    ...state,
    resetViolations,
  };
}

export default useTabDetection;
