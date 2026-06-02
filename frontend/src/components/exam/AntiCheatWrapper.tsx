import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { useTabDetection } from '../../hooks/useTabDetection';
import { studentSocket } from '../../services/student.socket';

export type LockdownMode = 'strict' | 'warning' | 'none';

export interface AntiCheatWrapperProps {
  children: React.ReactNode;
  enabled?: boolean;
  lockdownMode?: LockdownMode;
  attemptId?: string;
  onViolation?: (type: string, count: number) => void;
  onMaxViolationsReached?: () => void;
  maxTabSwitches?: number;
  maxViolations?: number;
  showWarnings?: boolean;
}

interface Violation {
  type: string;
  timestamp: number;
  message: string;
}

const AntiCheatWrapper: React.FC<AntiCheatWrapperProps> = ({
  children,
  enabled = true,
  lockdownMode = 'warning',
  attemptId,
  onViolation,
  onMaxViolationsReached,
  maxTabSwitches = 5,
  maxViolations = 10,
  showWarnings = true,
}) => {
  const { t } = useTranslation();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [currentWarning, setCurrentWarning] = useState<Violation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenRequested, setFullscreenRequested] = useState(false);
  const totalViolationsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use tab detection hook
  const { violationCount: tabViolations } = useTabDetection({
    enabled: enabled && lockdownMode !== 'none',
    maxViolations: maxTabSwitches,
    attemptId,
    reportToServer: true,
    onViolation: (count) => {
      addViolation('TAB_SWITCH', t('antiCheat.tabSwitchWarning') || 'Tab switch detected');
      onViolation?.('TAB_SWITCH', count);
    },
    onMaxViolationsReached: () => {
      onMaxViolationsReached?.();
    },
  });

  const addViolation = useCallback(
    (type: string, message: string) => {
      if (!showWarnings) return;

      const violation: Violation = {
        type,
        timestamp: Date.now(),
        message,
      };

      setViolations((prev) => [...prev, violation]);
      setCurrentWarning(violation);
      setShowWarning(true);
      totalViolationsRef.current += 1;

      // Report to server
      if (attemptId) {
        studentSocket.reportActivity('VIOLATION', {
          type,
          message,
          totalCount: totalViolationsRef.current,
        });
      }

      // Auto-hide warning after 5 seconds
      setTimeout(() => {
        setShowWarning(false);
        setCurrentWarning(null);
      }, 5000);

      // Check max violations
      if (totalViolationsRef.current >= maxViolations) {
        onMaxViolationsReached?.();
      }
    },
    [showWarnings, attemptId, maxViolations, onMaxViolationsReached]
  );

  // Prevent right-click context menu
  useEffect(() => {
    if (!enabled || lockdownMode === 'none') return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (lockdownMode === 'strict') {
        addViolation('RIGHT_CLICK', t('antiCheat.rightClickDisabled') || 'Right-click is disabled');
      }
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, lockdownMode, addViolation, t]);

  // Prevent keyboard shortcuts
  useEffect(() => {
    if (!enabled || lockdownMode === 'none') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        { key: 'c', ctrl: true }, // Ctrl+C (copy)
        { key: 'x', ctrl: true }, // Ctrl+X (cut)
        { key: 'v', ctrl: true }, // Ctrl+V (paste)
        { key: 'p', ctrl: true }, // Ctrl+P (print)
        { key: 's', ctrl: true }, // Ctrl+S (save)
        { key: 'a', ctrl: true }, // Ctrl+A (select all)
        { key: 'F12' }, // Developer tools
        { key: 'i', ctrl: true, shift: true }, // Ctrl+Shift+I (dev tools)
        { key: 'j', ctrl: true, shift: true }, // Ctrl+Shift+J (dev tools)
        { key: 'u', ctrl: true }, // Ctrl+U (view source)
      ];

      const isBlocked = blockedKeys.some(
        (blocked) =>
          e.key.toLowerCase() === blocked.key.toLowerCase() &&
          (!blocked.ctrl || e.ctrlKey || e.metaKey) &&
          (!blocked.shift || e.shiftKey)
      );

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();

        if (lockdownMode === 'strict') {
          let message = t('antiCheat.keyboardShortcutBlocked') || 'Keyboard shortcut blocked';
          if (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey)) {
            message = t('antiCheat.copyDisabled') || 'Copy is disabled during the exam';
          } else if (e.key.toLowerCase() === 'v' && (e.ctrlKey || e.metaKey)) {
            message = t('antiCheat.pasteDisabled') || 'Paste is disabled during the exam';
          } else if (e.key === 'F12') {
            message = t('antiCheat.devToolsDisabled') || 'Developer tools are disabled';
          }
          addViolation('KEYBOARD_SHORTCUT', message);
        }

        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, lockdownMode, addViolation, t]);

  // Prevent text selection on questions (optional, based on lockdownMode)
  useEffect(() => {
    if (!enabled || lockdownMode !== 'strict') return;

    const style = document.createElement('style');
    style.id = 'anti-cheat-style';
    style.textContent = `
      .anti-cheat-no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('anti-cheat-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [enabled, lockdownMode]);

  // Request fullscreen on strict mode
  const requestFullscreen = useCallback(async () => {
    try {
      if (containerRef.current && document.fullscreenEnabled) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        setFullscreenRequested(true);
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    }
  }, []);

  // Detect fullscreen exit
  useEffect(() => {
    if (!enabled || lockdownMode !== 'strict') return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (fullscreenRequested && !isCurrentlyFullscreen) {
        addViolation(
          'FULLSCREEN_EXIT',
          t('antiCheat.fullscreenExitWarning') || 'You exited fullscreen mode'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, lockdownMode, fullscreenRequested, addViolation, t]);

  // Request fullscreen on mount for strict mode
  useEffect(() => {
    if (enabled && lockdownMode === 'strict' && !fullscreenRequested) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        requestFullscreen();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enabled, lockdownMode, fullscreenRequested, requestFullscreen]);

  // Prevent print
  useEffect(() => {
    if (!enabled || lockdownMode === 'none') return;

    const handleBeforePrint = () => {
      if (lockdownMode === 'strict') {
        addViolation('PRINT_ATTEMPT', t('antiCheat.printDisabled') || 'Printing is disabled');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [enabled, lockdownMode, addViolation, t]);

  // Detect dev tools (basic detection)
  useEffect(() => {
    if (!enabled || lockdownMode !== 'strict') return;

    let devToolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          addViolation(
            'DEV_TOOLS',
            t('antiCheat.devToolsDetected') || 'Developer tools detected'
          );
        }
      } else {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(checkDevTools, 1000);
    return () => clearInterval(interval);
  }, [enabled, lockdownMode, addViolation, t]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    setCurrentWarning(null);
  }, []);

  if (!enabled || lockdownMode === 'none') {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${lockdownMode === 'strict' ? 'anti-cheat-no-select' : ''}`}
    >
      {children}

      {/* Warning Toast */}
      {showWarning && currentWarning && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  {t('antiCheat.warning') || 'Warning'}
                </h4>
                <p className="text-sm text-yellow-700 mt-1">{currentWarning.message}</p>
                <p className="text-xs text-yellow-600 mt-2">
                  {t('antiCheat.violationCount', { count: totalViolationsRef.current }) ||
                    `Violations: ${totalViolationsRef.current}`}
                </p>
              </div>
              <button
                onClick={dismissWarning}
                className="text-yellow-500 hover:text-yellow-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Request Banner (for strict mode when not fullscreen) */}
      {lockdownMode === 'strict' && !isFullscreen && fullscreenRequested && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowsPointingOutIcon className="h-6 w-6" />
                <span className="text-sm font-medium">
                  {t('antiCheat.fullscreenRequired') ||
                    'Please return to fullscreen mode to continue the exam'}
                </span>
              </div>
              <button
                onClick={requestFullscreen}
                className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50"
              >
                {t('antiCheat.enterFullscreen') || 'Enter Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Counter Badge */}
      {tabViolations > 0 && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
            {t('antiCheat.tabSwitches', { count: tabViolations }) ||
              `Tab switches: ${tabViolations}/${maxTabSwitches}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiCheatWrapper;
