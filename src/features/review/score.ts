import { MANUAL_MAX_POINTS } from '@/features/classes/class-data';

/** The score field accepts whole points 0..10; anything else is invalid (null). */
export function parseScore(input: string): number | null {
  const value = input.trim();
  if (!/^\d{1,2}$/.test(value)) return null;
  const n = Number(value);
  return n <= MANUAL_MAX_POINTS ? n : null;
}
