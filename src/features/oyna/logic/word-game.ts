import { sameWord } from '@/features/oyna/logic/shuffle';

/** The word game's steps in the order the old app played them: learn, recognize, drill. */
export type WordStep = 'cards' | 'shuffle' | 'complete' | 'tiles' | 'grid' | 'captcha' | 'match' | 'mcq';

export interface WordGameShape {
  words: readonly unknown[];
  recognize: {
    shuffle?: { pairs: readonly unknown[] } | null;
    complete?: { pairs: readonly unknown[] } | null;
    tiles?: { tiles: readonly unknown[] } | null;
    grid?: { rows: readonly string[]; words: readonly string[] } | null;
  };
  drill: {
    captcha?: { clouds: readonly unknown[] } | null;
    match?: readonly unknown[] | null;
    mcq?: readonly unknown[] | null;
  };
}

export function wordSteps(game: WordGameShape): WordStep[] {
  const { recognize: r, drill: d } = game;
  const steps: [WordStep, boolean][] = [
    ['cards', game.words.length > 0],
    ['shuffle', !!r.shuffle?.pairs.length],
    ['complete', !!r.complete?.pairs.length],
    ['tiles', !!r.tiles?.tiles.length],
    ['grid', !!r.grid?.rows.length && !!r.grid.words.length],
    ['captcha', !!d.captcha?.clouds.length],
    ['match', !!d.match?.length],
    ['mcq', !!d.mcq?.length],
  ];
  return steps.filter(([, on]) => on).map(([s]) => s);
}

// ---- Fill-in ("бос орынды толтыру"): "т_би_ат" + letters "аға" ----

/** Slots of the unfinished word: a letter, or null for a gap the student fills. */
export const parsePattern = (unfinished: string): (string | null)[] => [...unfinished].map((ch) => (ch === '_' ? null : ch));

/** Put a letter into the first empty gap. */
export function fillGap(slots: readonly (string | null)[], letter: string): (string | null)[] {
  const i = slots.indexOf(null);
  if (i < 0) return [...slots];
  const next = [...slots];
  next[i] = letter;
  return next;
}

export const slotsFilled = (slots: readonly (string | null)[]) => slots.every((s) => s !== null);
export const slotsWord = (slots: readonly (string | null)[]) => slots.map((s) => s ?? '').join('');

// ---- Topic tiles: pages of 9 words, pick every word that belongs to the topic ----

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export const tilesPageDone = (page: readonly { correct: boolean }[], picked: ReadonlySet<number>) =>
  page.every((tile, i) => !tile.correct || picked.has(i));

// ---- Word search grid ----

export type Cell = { row: number; col: number };

/** Cells on the straight horizontal or vertical line from a to b (inclusive), or null if not in line. */
export function lineBetween(a: Cell, b: Cell): Cell[] | null {
  if (a.row === b.row) {
    const [from, to] = a.col <= b.col ? [a.col, b.col] : [b.col, a.col];
    return Array.from({ length: to - from + 1 }, (_, i) => ({ row: a.row, col: from + i }));
  }
  if (a.col === b.col) {
    const [from, to] = a.row <= b.row ? [a.row, b.row] : [b.row, a.row];
    return Array.from({ length: to - from + 1 }, (_, i) => ({ row: from + i, col: a.col }));
  }
  return null;
}

export const lettersAt = (rows: readonly string[], cells: readonly Cell[]) => cells.map((c) => [...(rows[c.row] ?? '')][c.col] ?? '').join('');

/** The target word the selection spells (either direction) that is not found yet. */
export function gridWordAt(rows: readonly string[], words: readonly string[], cells: readonly Cell[], found: ReadonlySet<string>): string | null {
  if (cells.length < 2) return null;
  const forward = lettersAt(rows, cells);
  const backward = [...forward].reverse().join('');
  return words.find((w) => !found.has(w) && (sameWord(w, forward) || sameWord(w, backward))) ?? null;
}

/** Where each target word sits in the grid (to paint found words and reveal missed ones). */
export function locateWord(rows: readonly string[], word: string): Cell[] | null {
  const target = word.toLocaleUpperCase();
  const len = [...target].length;
  const grid = rows.map((r) => [...r.toLocaleUpperCase()]);
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
        const cells = Array.from({ length: len }, (_, i) => ({ row: row + dr * i, col: col + dc * i }));
        const text = cells.map((c) => grid[c.row]?.[c.col] ?? '').join('');
        if (text === target || [...text].reverse().join('') === target) return cells;
      }
    }
  }
  return null;
}

// ---- Matching: the first translation picked for a word is what gets graded ----

export interface MatchState {
  /** word -> translation the student picked first */
  first: Record<string, string>;
  matched: string[];
}

export const emptyMatch: MatchState = { first: {}, matched: [] };

export function pickMatch(state: MatchState, word: string, translation: string, correctTranslation: string): { state: MatchState; correct: boolean } {
  const correct = translation === correctTranslation;
  const first = word in state.first ? state.first : { ...state.first, [word]: translation };
  const matched = correct && !state.matched.includes(word) ? [...state.matched, word] : state.matched;
  return { state: { first, matched }, correct };
}

export function matchPayload(pairs: readonly { word: string; translation: string }[], state: MatchState) {
  return pairs.map((p) => ({ word: p.word, translation: state.first[p.word] ?? '' }));
}

// ---- Multiple choice: the first option is the correct answer (API convention) ----

export interface McqQuestion {
  options: readonly { word: string; translation?: string | null; imageUrl?: string | null }[];
}

export const mcqAnswer = (q: McqQuestion) => q.options[0]?.word ?? '';

export function mcqPayload(questions: readonly McqQuestion[], picked: readonly (string | undefined)[]) {
  return questions.flatMap((q, i) => (picked[i] === undefined ? [] : [{ answer: mcqAnswer(q), studentAnswer: picked[i]! }]));
}

/** Correct answers out of total, for the result screen. */
export const countCorrect = (items: readonly { expected: string; given?: string | null }[]) =>
  items.filter((i) => i.given != null && i.given === i.expected).length;
