import { useEffect, useEffectEvent, useState } from 'react';

/** A timed game's countdown, for PlayerFrame's `timer`: TimerPill ticks it, so the game itself doesn't re-render every second. */
export type SessionTimer = { endsAt: number; running: boolean };

/**
 * When the game opened and, for timed games, when it ends. `onTimeUp` runs once when the countdown
 * reaches zero, with the seconds spent, and always sees the latest render's state.
 */
export function useSessionClock(duration: number | null, running: boolean, onTimeUp?: (spent: number) => void) {
  const [started] = useState(() => Date.now());
  const endsAt = duration ? started + duration * 1000 : null;

  /** Seconds spent so far, at least 1 (the API treats 0 as "not finished") and capped at the duration. */
  const spent = () => {
    const s = Math.max(1, Math.round((Date.now() - started) / 1000));
    return duration ? Math.min(s, duration) : s;
  };
  const timeUp = useEffectEvent(() => onTimeUp?.(spent()));

  useEffect(() => {
    if (endsAt == null || !running) return;
    const timer = setTimeout(timeUp, Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(timer);
  }, [endsAt, running]);

  const timer: SessionTimer | null = endsAt == null ? null : { endsAt, running };
  return { timer, spent };
}
