import type { ClassLabelFragment } from '@/graphql/graphql';

/** The design's short date: "4 қаз.", "4 окт.", "4 Oct". Takes unix seconds and `t` for the month names. */
export function shortDate(seconds: number | null | undefined, t: (key: string) => string): string {
  if (!seconds) return '—';
  const d = new Date(seconds * 1000);
  return `${d.getDate()} ${t(`assignments.months.${d.getMonth()}`)}`;
}

/** "28.09" labels under chart bars. */
export function dayMonth(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "7А" from the API's grade + letter (grade is optional for tutor groups). */
export const className = (c: Pick<ClassLabelFragment, 'grade' | 'letter'>) => `${c.grade ?? ''}${c.letter}`;

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
