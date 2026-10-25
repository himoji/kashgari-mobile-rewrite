import type { GameCrosswordDirection } from '@/graphql/graphql';

/**
 * Crossword: words placed across (HORIZONTAL) or down (VERTICAL) on a grid of up to 10×10, each with a clue.
 * Letters are stored per cell, so crossing words share them.
 */
export type CrosswordDirection = GameCrosswordDirection;
export type CrosswordWord = { row: number; col: number; direction: CrosswordDirection; clue: string; length: number; word?: string | null };

export type CrosswordEntry = CrosswordWord & {
  id: string;
  /** The number printed in the first cell (shared by words that start in the same cell). */
  number: number;
  /** Cell keys ("row,col") in reading order. */
  cells: string[];
};

export type CrosswordLayout = {
  entries: CrosswordEntry[];
  /** Bounding box of the used cells. */
  top: number;
  left: number;
  rows: number;
  cols: number;
  /** Cell key → indexes of the entries that cross it. */
  cellEntries: Map<string, number[]>;
};

/** Answer of a crossword step: cell key → letter. */
export type CrosswordAnswer = Record<string, string>;

export const key = (row: number, col: number) => `${row},${col}`;

export function crosswordLayout(words: CrosswordWord[]): CrosswordLayout {
  // Numbered in reading order of their first cell, as printed crosswords are.
  const starts = [...new Set([...words].sort((a, b) => a.row - b.row || a.col - b.col).map((w) => key(w.row, w.col)))];
  const numbers = new Map(starts.map((k, i) => [k, i + 1]));
  const cellEntries = new Map<string, number[]>();
  let top = Infinity;
  let left = Infinity;
  let bottom = -1;
  let right = -1;
  const entries = words.map((w, index) => {
    const start = key(w.row, w.col);
    const cells = Array.from({ length: w.length }, (_, i) => {
      const row = w.row + (w.direction === 'VERTICAL' ? i : 0);
      const col = w.col + (w.direction === 'HORIZONTAL' ? i : 0);
      top = Math.min(top, row);
      left = Math.min(left, col);
      bottom = Math.max(bottom, row);
      right = Math.max(right, col);
      const k = key(row, col);
      cellEntries.set(k, [...(cellEntries.get(k) ?? []), index]);
      return k;
    });
    return { ...w, id: `${start},${w.direction}`, number: numbers.get(start)!, cells };
  });
  if (!entries.length) return { entries, top: 0, left: 0, rows: 0, cols: 0, cellEntries };
  return { entries, top, left, rows: bottom - top + 1, cols: right - left + 1, cellEntries };
}

/** Clue senses are separated by "\~"; translations inside a sense by "~\". */
export function clueSenses(clue: string): string[] {
  return clue
    .split('\\~')
    .map((s) => s.split('~\\').map((p) => p.trim()).filter(Boolean).join(' · '))
    .filter(Boolean);
}

/** One typed letter: the last character of the input, lowercased (the server ignores case). */
export function normalizeLetter(input: string): string {
  const chars = Array.from(input.trim());
  return (chars[chars.length - 1] ?? '').toLocaleLowerCase('kk');
}

/** The word as typed so far, with "_" for empty cells (the format the old app sent). */
export const entryText = (entry: CrosswordEntry, answer: CrosswordAnswer) => entry.cells.map((k) => answer[k] || '_').join('');

export const isEntryFilled = (entry: CrosswordEntry, answer: CrosswordAnswer) => entry.cells.every((k) => !!answer[k]);

export const isCrosswordComplete = (layout: CrosswordLayout, answer: CrosswordAnswer) => layout.entries.every((e) => isEntryFilled(e, answer));

/** Which word a tapped cell selects: keep the current word if it crosses the cell; tapping the focused cell again switches direction. */
export function pickEntry(layout: CrosswordLayout, cell: string, current: number, focused: string | null): number {
  const crossing = layout.cellEntries.get(cell) ?? [];
  if (!crossing.length) return current;
  if (crossing.includes(current)) {
    if (focused === cell && crossing.length > 1) return crossing.find((i) => i !== current)!;
    return current;
  }
  return crossing[0]!;
}

/** The cell to move to after typing (next) or erasing (previous) within the word, or null at its end. */
export function stepCell(entry: CrosswordEntry, cell: string, delta: 1 | -1): string | null {
  const i = entry.cells.indexOf(cell);
  if (i < 0) return null;
  return entry.cells[i + delta] ?? null;
}

/** The `crossword` part of SubmissionInput; words with no letters are left out. */
export function crosswordSubmission(layout: CrosswordLayout, answer: CrosswordAnswer) {
  return layout.entries
    .filter((e) => e.cells.some((k) => answer[k]))
    .map((e) => ({ word: entryText(e, answer), row: e.row, col: e.col, direction: e.direction }));
}

/** Rebuilds the cell letters of a reviewed crossword from the submitted words ("_" = empty). */
export function crosswordAnswerFromWords(layout: CrosswordLayout, answers: (string | null | undefined)[]): CrosswordAnswer {
  const answer: CrosswordAnswer = {};
  layout.entries.forEach((e, i) => {
    const letters = Array.from(answers[i] ?? '');
    e.cells.forEach((k, j) => {
      const ch = letters[j];
      if (ch && ch !== '_' && !answer[k]) answer[k] = ch.toLocaleLowerCase('kk');
    });
  });
  return answer;
}

export type CrosswordCellState = 'correct' | 'wrong' | 'empty';

/** Review: each cell against the right letter of any word crossing it. */
export function crosswordCellState(layout: CrosswordLayout, answer: CrosswordAnswer, cell: string): CrosswordCellState {
  const typed = answer[cell];
  if (!typed) return 'empty';
  for (const i of layout.cellEntries.get(cell) ?? []) {
    const e = layout.entries[i]!;
    const right = e.word ? Array.from(e.word)[e.cells.indexOf(cell)] : undefined;
    if (right) return right.toLocaleLowerCase('kk') === typed.toLocaleLowerCase('kk') ? 'correct' : 'wrong';
  }
  return 'empty';
}

export const isEntryCorrect = (entry: CrosswordEntry, answer: CrosswordAnswer) =>
  !!entry.word && entryText(entry, answer).toLocaleLowerCase('kk') === entry.word.toLocaleLowerCase('kk');
