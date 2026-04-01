import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
}

interface UseRateLimitReturn {
  isLocked: boolean;
  remainingLockoutSeconds: number;
  recordAttempt: () => void;
  reset: () => void;
}

/**
 * Client-side rate limiter for form submissions.
 * After `maxAttempts` failed attempts within `windowMs`, locks out for `lockoutMs`.
 * This is defense-in-depth only — server-side rate limiting is the real guard.
 */
export function useRateLimit({
  maxAttempts = 5,
  windowMs = 60_000,
  lockoutMs = 30_000,
}: UseRateLimitOptions): UseRateLimitReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);
  const attemptsRef = useRef<number[]>([]);
  const lockoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearTimeout(lockoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startLockout = useCallback(() => {
    setIsLocked(true);
    setRemainingLockoutSeconds(Math.ceil(lockoutMs / 1000));

    // Countdown timer for UI display
    countdownRef.current = setInterval(() => {
      setRemainingLockoutSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Unlock after lockout period
    lockoutTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      setRemainingLockoutSeconds(0);
      attemptsRef.current = [];
      if (countdownRef.current) clearInterval(countdownRef.current);
    }, lockoutMs);
  }, [lockoutMs]);

  const recordAttempt = useCallback(() => {
    if (isLocked) return;

    const now = Date.now();
    // Remove attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      (timestamp) => now - timestamp < windowMs
    );
    attemptsRef.current.push(now);

    if (attemptsRef.current.length >= maxAttempts) {
      startLockout();
    }
  }, [isLocked, windowMs, maxAttempts, startLockout]);

  const reset = useCallback(() => {
    setIsLocked(false);
    setRemainingLockoutSeconds(0);
    attemptsRef.current = [];
    if (lockoutTimerRef.current) clearTimeout(lockoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  return { isLocked, remainingLockoutSeconds, recordAttempt, reset };
}
