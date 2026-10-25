import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/storage';

export const FONT_MIN = 16;
export const FONT_MAX = 28;

/** Per-device reading preferences: text size and whether the "tap a word" guide was seen. */
export const useReaderPrefs = create<{
  fontSize: number;
  guideSeen: boolean;
  changeFont: (step: number) => void;
  seeGuide: () => void;
}>()(
  persist(
    (set) => ({
      fontSize: FONT_MIN,
      guideSeen: false,
      changeFont: (step) =>
        set((s) => ({ fontSize: Math.max(FONT_MIN, Math.min(FONT_MAX, s.fontSize + step)) })),
      seeGuide: () => set({ guideSeen: true }),
    }),
    { name: 'danatiin-reader', storage: createJSONStorage(() => secureStorage) },
  ),
);
