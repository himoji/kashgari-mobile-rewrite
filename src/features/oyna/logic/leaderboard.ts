export interface BoardRow {
  id: string;
  name: string;
  points: number;
  time: number;
}

/** Class leaderboard: most points first, then fastest; equal results share a place. */
export function rankRows(rows: readonly BoardRow[]): (BoardRow & { place: number })[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points || a.time - b.time);
  const out: (BoardRow & { place: number })[] = [];
  sorted.forEach((row, i) => {
    const prev = out[i - 1];
    const tie = prev && prev.points === row.points && prev.time === row.time;
    out.push({ ...row, place: tie ? prev.place : i + 1 });
  });
  return out;
}
