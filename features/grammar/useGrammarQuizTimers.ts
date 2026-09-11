import { useCallback, useEffect, useRef } from 'react';

export type GrammarQuizTimer = 'incorrect' | 'gameOver' | 'speech';
export type ScheduleGrammarQuizTimer = (
  timer: GrammarQuizTimer,
  callback: () => void,
  delay: number,
) => void;

/**
 * Owns the non-feedback timeouts used by a quiz session. Scheduling a timer
 * replaces the previous timer of the same kind, and all timers are cancelled
 * together when the component unmounts or the session is reset.
 */
export const useGrammarQuizTimers = (onDispose?: () => void) => {
  const timersRef = useRef<Partial<Record<GrammarQuizTimer, ReturnType<typeof setTimeout>>>>({});

  const clearTimer = useCallback((timer: GrammarQuizTimer) => {
    const timeout = timersRef.current[timer];
    if (timeout !== undefined) {
      clearTimeout(timeout);
      delete timersRef.current[timer];
    }
  }, []);

  const scheduleTimer = useCallback((
    timer: GrammarQuizTimer,
    callback: () => void,
    delay: number,
  ) => {
    clearTimer(timer);
    timersRef.current[timer] = setTimeout(() => {
      delete timersRef.current[timer];
      callback();
    }, delay);
  }, [clearTimer]);

  const clearAllTimers = useCallback(() => {
    (Object.keys(timersRef.current) as GrammarQuizTimer[]).forEach(clearTimer);
  }, [clearTimer]);

  useEffect(() => () => {
    clearAllTimers();
    onDispose?.();
  }, [clearAllTimers, onDispose]);

  return { scheduleTimer, clearTimer, clearAllTimers };
};
