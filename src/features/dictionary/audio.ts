import type { ContentLanguage } from '@/features/auth/session';

/** Pronunciation files on kashgari.kz, named as the old app and the web build them. */
export function wordAudioUrl(
  language: ContentLanguage,
  word: { id: string; url: string },
): string | null {
  if (!word.url) return null;
  const slug = word.url.split(' ').join('_');
  const base = 'https://www.kashgari.kz/audio';
  return language === 'kk'
    ? `${base}/kz/${slug}_${word.id}.mp3`
    : `${base}/${language}/${slug}.mp3`;
}
