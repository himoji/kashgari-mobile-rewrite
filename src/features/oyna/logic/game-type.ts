/** The four Oyna game types a student can play. Battleships and the infinite runner are not ported. */
export type OynaKind = 'wordgame' | 'wordle' | 'quizlet' | 'ministory';

const BY_NAME: Record<string, OynaKind> = {
  wordgame: 'wordgame',
  oynagamewordgame: 'wordgame',
  wordle: 'wordle',
  oynagamewordle: 'wordle',
  quizlet: 'quizlet',
  oynagamequizlet: 'quizlet',
  ministory: 'ministory',
  oynagameministory: 'ministory',
};

/** Accepts our short kind or the API's `__typename` (`OynaGameWordle`...), so the school list can pass either. */
export function oynaKind(value: string | null | undefined): OynaKind | null {
  if (!value) return null;
  return BY_NAME[value.replace(/[^a-z]/gi, '').toLowerCase()] ?? null;
}

/** 75 -> "1:15" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
