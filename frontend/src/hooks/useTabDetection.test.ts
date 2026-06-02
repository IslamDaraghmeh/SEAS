import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabDetection } from './useTabDetection';

// Mock the student socket
vi.mock('../services/student.socket', () => ({
  studentSocket: {
    reportActivity: vi.fn(),
  },
}));

describe('useTabDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock document.hasFocus to return true by default
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    // Mock visibilityState to return visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with zero violations', () => {
    const { result } = renderHook(() => useTabDetection());

    expect(result.current.violationCount).toBe(0);
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isFocused).toBe(true);
  });

  it('tracks visibility changes', () => {
    const onViolation = vi.fn();
    renderHook(() => useTabDetection({ onViolation }));

    // Simulate visibility change to hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(onViolation).toHaveBeenCalledWith(1);
  });

  it('tracks blur events', () => {
    const onViolation = vi.fn();
    renderHook(() => useTabDetection({ onViolation }));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(onViolation).toHaveBeenCalled();
  });

  it('respects maxViolations setting', () => {
    const onMaxViolationsReached = vi.fn();
    const onViolation = vi.fn();

    renderHook(() =>
      useTabDetection({
        maxViolations: 2,
        onViolation,
        onMaxViolationsReached,
      })
    );

    // Trigger first blur event
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    // Simulate user returning and leaving again
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(onMaxViolationsReached).toHaveBeenCalled();
  });

  it('can reset violations', () => {
    const { result } = renderHook(() => useTabDetection());

    // Trigger a violation
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current.violationCount).toBeGreaterThan(0);

    // Reset
    act(() => {
      result.current.resetViolations();
    });

    expect(result.current.violationCount).toBe(0);
  });

  it('does not track when disabled', () => {
    const onViolation = vi.fn();
    renderHook(() => useTabDetection({ enabled: false, onViolation }));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(onViolation).not.toHaveBeenCalled();
  });
});
