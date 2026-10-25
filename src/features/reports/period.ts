export type Period = 'week' | 'month' | 'quarter' | 'allTime';
export const PERIODS: Period[] = ['week', 'month', 'quarter', 'allTime'];

const DAY = 86400;
const seconds = (d: Date) => Math.floor(d.getTime() / 1000);

/** Start of the period (unix seconds), null for all time. Week starts Monday; school quarters start Sep, Nov, Jan, Apr. */
export function periodStart(period: Period, now = new Date()): number | null {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return seconds(d);
  }
  if (period === 'month') return seconds(new Date(now.getFullYear(), now.getMonth(), 1));
  if (period === 'quarter') {
    const m = now.getMonth();
    const start = m >= 10 ? 10 : m >= 8 ? 8 : m >= 3 ? 3 : 0;
    return seconds(new Date(now.getFullYear(), start, 1));
  }
  return null;
}

/** Five equal ranges ending now for the activity chart (all time: the last five months). */
export function activityBuckets(period: Period, now = new Date()): { after: number; before: number }[] {
  const end = seconds(now);
  const start = periodStart(period, now) ?? end - 150 * DAY;
  const span = Math.max(DAY, Math.ceil((end - start) / 5));
  return Array.from({ length: 5 }, (_, i) => ({ after: end - (5 - i) * span, before: end - (4 - i) * span }));
}
