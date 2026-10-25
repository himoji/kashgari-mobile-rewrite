import type { ContentLanguage } from '@/features/auth/session';

export type LetterState = 'correct' | 'present' | 'absent';
export const WORDLE_MAX_GUESSES = 6;

const up = (s: string) => s.toLocaleUpperCase();

/** Standard two-pass Wordle colouring: exact letters first, then remaining letters by count. */
export function evaluateGuess(guess: string, target: string): LetterState[] {
  const g = [...up(guess)];
  const t = [...up(target)];
  const left = new Map<string, number>();
  const states: LetterState[] = g.map((letter, i) => {
    if (letter === t[i]) return 'correct';
    left.set(t[i]!, (left.get(t[i]!) ?? 0) + 1);
    return 'absent';
  });
  // letters of the target that were not matched exactly
  for (let i = g.length; i < t.length; i++) left.set(t[i]!, (left.get(t[i]!) ?? 0) + 1);
  g.forEach((letter, i) => {
    if (states[i] === 'correct') return;
    const n = left.get(letter) ?? 0;
    if (n > 0) {
      states[i] = 'present';
      left.set(letter, n - 1);
    }
  });
  return states;
}

const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };

/** Keyboard colours: a key keeps its best state across guesses. */
export function keyStates(guesses: readonly string[], target: string): Record<string, LetterState> {
  const out: Record<string, LetterState> = {};
  for (const guess of guesses) {
    const states = evaluateGuess(guess, target);
    [...up(guess)].forEach((letter, i) => {
      const s = states[i]!;
      if (!out[letter] || rank[s] > rank[out[letter]]) out[letter] = s;
    });
  }
  return out;
}

export const isSolved = (guesses: readonly string[], target: string) => guesses.some((g) => up(g) === up(target));
export const isWordDone = (guesses: readonly string[], target: string) =>
  isSolved(guesses, target) || guesses.length >= WORDLE_MAX_GUESSES;

/**
 * Payload for `wordleSubmit`: one list per word, full-length uppercase guesses only, nothing after the
 * correct guess (the API rejects anything else).
 */
export function wordleGuessesPayload(words: readonly string[], guesses: readonly (readonly string[])[]): string[][] {
  return words.map((word, i) => {
    const list = (guesses[i] ?? []).map(up).filter((g) => [...g].length === [...up(word)].length);
    const hit = list.indexOf(up(word));
    return (hit >= 0 ? list.slice(0, hit + 1) : list).slice(0, WORDLE_MAX_GUESSES);
  });
}

const KK = [
  ['Ә', 'І', 'Ң', 'Ғ', 'Ү', 'Ұ', 'Қ', 'Ө', 'Һ'],
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Ъ', 'Б', 'Ю', 'Ё'],
];
const RU = KK.slice(1);
const LATIN = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

/** On-screen keyboard rows for the account's content language. */
export function keyboardRows(language: ContentLanguage): string[][] {
  if (language === 'kk') return KK;
  if (language === 'ru') return RU;
  return LATIN;
}
