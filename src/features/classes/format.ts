import type { UiLanguage } from '@/features/auth/session';
import type { ClassLabelFragment } from '@/graphql/graphql';

const MONTHS: Record<UiLanguage, string[]> = {
  kk: ['қаң.', 'ақп.', 'нау.', 'сәу.', 'мам.', 'мау.', 'шіл.', 'там.', 'қыр.', 'қаз.', 'қар.', 'жел.'],
  ru: ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** The design's short date: "4 қаз.", "4 окт.", "4 Oct". Takes unix seconds. */
export function shortDate(seconds: number | null | undefined, language: UiLanguage): string {
  if (!seconds) return '—';
  const d = new Date(seconds * 1000);
  return `${d.getDate()} ${MONTHS[language][d.getMonth()]}`;
}

/** "28.09" labels under chart bars. */
export function dayMonth(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "7А" from the API's grade + letter (grade is optional for tutor groups). */
export const className = (c: Pick<ClassLabelFragment, 'grade' | 'letter'>) => `${c.grade ?? ''}${c.letter}`;

export const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
