/**
 * Word search ("Сөз торы"): the server hides words left-to-right or top-to-bottom in a square of letters.
 * The student taps the letters of a word and checks the selection.
 */
export type Cell = { row: number; col: number };
export type Direction = 'H' | 'V';
export type Placement = { row: number; col: number; dir: Direction };

/** Answer of a grid step: found word → its placement, encoded as "row,col,H|V". */
export type GridAnswer = Record<string, string>;

const upper = (s: string) => s.toLocaleUpperCase('kk');

export const cellKey = ({ row, col }: Cell) => `${row},${col}`;

export const encodePlacement = ({ row, col, dir }: Placement) => `${row},${col},${dir}`;

export function decodePlacement(value: string): Placement | null {
  const [r, c, d] = value.split(',');
  const row = Number(r);
  const col = Number(c);
  if (!Number.isInteger(row) || !Number.isInteger(col) || (d !== 'H' && d !== 'V')) return null;
  return { row, col, dir: d };
}

export const gridLetters = (rows: string[]) => rows.map((r) => Array.from(r));

export function placementCells(word: string, { row, col, dir }: Placement): Cell[] {
  return Array.from(word, (_, i) => (dir === 'H' ? { row, col: col + i } : { row: row + i, col }));
}

/** Where a word sits in the grid (rows first, as the server places H and V words). */
export function locateWord(rows: string[], word: string): Placement | null {
  const grid = gridLetters(rows).map((r) => r.map(upper));
  const w = Array.from(upper(word));
  if (!w.length) return null;
  const fits = (row: number, col: number, dir: Direction) =>
    w.every((ch, i) => (dir === 'H' ? grid[row]?.[col + i] : grid[row + i]?.[col]) === ch);
  for (const dir of ['H', 'V'] as const)
    for (let row = 0; row < grid.length; row++)
      for (let col = 0; col < (grid[row]?.length ?? 0); col++) if (fits(row, col, dir)) return { row, col, dir };
  return null;
}

/** The selected cells in order when they form one unbroken row or column run, otherwise null. */
export function straightRun(cells: Cell[]): Cell[] | null {
  if (cells.length < 2) return null;
  const sameRow = cells.every((c) => c.row === cells[0]!.row);
  const sameCol = cells.every((c) => c.col === cells[0]!.col);
  if (!sameRow && !sameCol) return null;
  const sorted = [...cells].sort((a, b) => (sameRow ? a.col - b.col : a.row - b.row));
  const unbroken = sorted.every((c, i) => i === 0 || (sameRow ? c.col - sorted[i - 1]!.col : c.row - sorted[i - 1]!.row) === 1);
  return unbroken ? sorted : null;
}

/** The hidden word the selection spells (either way round), with its placement; null if none. */
export function matchSelection(rows: string[], words: string[], cells: Cell[]): { word: string; placement: Placement } | null {
  const run = straightRun(cells);
  if (!run) return null;
  const grid = gridLetters(rows);
  const text = upper(run.map((c) => grid[c.row]?.[c.col] ?? '').join(''));
  const reversed = Array.from(text).reverse().join('');
  const word = words.find((w) => upper(w) === text) ?? words.find((w) => upper(w) === reversed);
  if (!word) return null;
  const dir: Direction = run[0]!.row === run[1]!.row ? 'H' : 'V';
  return { word, placement: { row: run[0]!.row, col: run[0]!.col, dir } };
}

/** Cells covered by the found words. */
export function foundCells(answer: GridAnswer): Set<string> {
  const keys = new Set<string>();
  for (const [word, value] of Object.entries(answer)) {
    const p = decodePlacement(value);
    if (p) placementCells(word, p).forEach((c) => keys.add(cellKey(c)));
  }
  return keys;
}

/** The `wordGrid` part of SubmissionInput. */
export function gridSubmission(words: string[], answer: GridAnswer): { word: string; row: number; col: number }[] {
  return words.flatMap((word) => {
    const p = answer[word] ? decodePlacement(answer[word]) : null;
    return p ? [{ word, row: p.row, col: p.col }] : [];
  });
}

/** Rebuilds the answer of a reviewed grid from the words the student found. */
export function gridAnswerFromFound(rows: string[], found: string[]): GridAnswer {
  const answer: GridAnswer = {};
  for (const word of found) {
    const p = locateWord(rows, word);
    if (p) answer[word] = encodePlacement(p);
  }
  return answer;
}

export type ReviewCell = 'found' | 'missed' | null;

/** In review every hidden word is shown: found ones green, missed ones red. */
export function gridReviewCells(rows: string[], words: string[], answer: GridAnswer): Map<string, ReviewCell> {
  const cells = new Map<string, ReviewCell>();
  for (const word of words) {
    if (answer[word]) continue;
    const p = locateWord(rows, word);
    if (p) placementCells(word, p).forEach((c) => cells.set(cellKey(c), 'missed'));
  }
  foundCells(answer).forEach((key) => cells.set(key, 'found'));
  return cells;
}
