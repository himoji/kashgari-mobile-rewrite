import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import { useSession, type UiLanguage } from '@/features/auth/session';
import { toLatin } from '@/lib/latin';
import en from '@/locales/en';
import kk from '@/locales/kk';
import ru from '@/locales/ru';

function i18nLanguage(s: { uiLanguage: UiLanguage; script: string }) {
  return s.uiLanguage === 'kk' && s.script === 'latn' ? 'kk-Latn' : s.uiLanguage;
}

type Tree = { [key: string]: string | Tree };
const latinize = (tree: Tree): Tree =>
  Object.fromEntries(
    Object.entries(tree).map(([k, v]) => [k, typeof v === 'string' ? toLatin(v) : latinize(v)]),
  );

void i18n.use(initReactI18next).init({
  resources: {
    kk: { translation: kk },
    'kk-Latn': { translation: latinize(kk as Tree) },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: i18nLanguage(useSession.getState()),
  fallbackLng: 'kk',
  interpolation: { escapeValue: false },
  returnNull: false,
});

useSession.subscribe((s) => {
  const lng = i18nLanguage(s);
  if (lng !== i18n.language) void i18n.changeLanguage(lng);
});

/** Order and labels as in the design's settings toggle. */
export const UI_LANGUAGES: { value: UiLanguage; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'kk', label: 'Қазақша' },
];

/** Learning content stays in its own language; Kazakh content follows the Latin script choice. */
export function useContentText() {
  const latin = useSession((s) => s.script === 'latn');
  return useCallback((text: string) => (latin ? toLatin(text) : text), [latin]);
}

export { i18n, useTranslation };
