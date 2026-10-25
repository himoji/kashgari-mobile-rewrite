import type { UiLanguage } from '@/features/auth/session';

/**
 * Game translations come as "русский | english" (sometimes with "; alternative").
 * Show the part for the student's explanation language; Kazakh explanations fall back to Russian.
 */
export function displayTranslation(raw: string | null | undefined, lang: UiLanguage): string {
  if (!raw) return '';
  // "-" marks a missing translation in the word lists.
  const [ru = '', en = ''] = raw.split('|').map((part) => (part.trim() === '-' ? '' : part.trim()));
  const picked = lang === 'en' ? en || ru : ru || en;
  const first = picked.split(';')[0]!.trim();
  return first === '-' ? '' : first;
}
