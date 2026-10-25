import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Seconds since the game opened and, for timed games, a countdown. `onTimeUp` runs once when the
 * countdown reaches zero and always sees the latest render's state.
 */
export function useSessionClock(duration: number | null, running: boolean, onTimeUp?: () => void) {
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const timeUp = useEffectEvent(() => onTimeUp?.());

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const elapsed = Math.max(0, Math.floor((now - started) / 1000));
  const remaining = duration ? Math.max(0, duration - elapsed) : null;

  useEffect(() => {
    if (running && remaining === 0) timeUp();
  }, [remaining, running]);

  /** Seconds spent so far, at least 1 (the API treats 0 as "not finished") and capped at the duration. */
  const spent = () => {
    const s = Math.max(1, Math.round((Date.now() - started) / 1000));
    return duration ? Math.min(s, duration) : s;
  };
  return { remaining, spent };
}
