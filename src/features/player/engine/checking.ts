import { crosswordLayout, isCrosswordComplete } from './crossword';
import type { StepAnswer, Step } from './types';

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** How many of the given words appear in the text (case-insensitive, any ending). */
export const wordsUsed = (words: string[], text: string) => {
  const lower = text.toLocaleLowerCase('kk');
  return words.filter((w) => w && lower.includes(w.toLocaleLowerCase('kk'))).length;
};

/** The letters of a scrambled word as tiles (spaces dropped). */
export const letters = (shuffled: string) => Array.from(shuffled).filter((c) => c.trim());

const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

export function asList(answer: StepAnswer | undefined): (string | null)[] {
  return Array.isArray(answer) ? answer : [];
}

export function asMap(answer: StepAnswer | undefined): Record<string, string> {
  return answer && !Array.isArray(answer) ? answer : {};
}

/** The step can be left with "Next": every item answered (passages, cards and links always can). */
export function isStepComplete(step: Step, answer: StepAnswer | undefined): boolean {
  switch (step.kind) {
    case 'passage':
    case 'cards':
    case 'link':
    case 'unsupported':
      return true;
    case 'choice':
      return step.questions.every((_, i) => filled(asList(answer)[i]));
    case 'complete':
      return step.sentences.every((_, i) => filled(asList(answer)[i]));
    case 'shuffle':
      return step.items.every((_, i) => filled(asList(answer)[i]));
    case 'match': {
      const map = asMap(answer);
      return step.pairs.every((p) => filled(map[p.word]));
    }
    case 'grid':
      // At least one word found: nothing can be answered wrong here, so requiring every word could trap a student.
      return Object.keys(asMap(answer)).length > 0;
    case 'crossword':
      return isCrosswordComplete(crosswordLayout(step.words), asMap(answer));
    case 'text':
      return step.prompts.every((_, i) => {
        const text = asList(answer)[i] ?? '';
        return step.minWords ? wordCount(text) >= step.minWords : filled(text);
      });
  }
}

/** Case and spacing do not matter when comparing typed answers. */
export const sameText = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').trim().toLocaleLowerCase('kk') === (b ?? '').trim().toLocaleLowerCase('kk');

/** Which tiles are already used by the typed answer (each letter of the answer uses one tile). */
export function usedTiles(tiles: string[], answer: string): boolean[] {
  const left = new Map<string, number>();
  for (const c of Array.from(answer.toLocaleUpperCase('kk'))) left.set(c, (left.get(c) ?? 0) + 1);
  return tiles.map((tile) => {
    const key = tile.toLocaleUpperCase('kk');
    const n = left.get(key) ?? 0;
    if (!n) return false;
    left.set(key, n - 1);
    return true;
  });
}
