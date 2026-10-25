export type RankRow = { id: string; name: string; score: number; own: boolean; rank: number };

/** Highest score first, ties by name (as the design), positions 1..n. */
export function rankRows(rows: Omit<RankRow, 'rank'>[]): RankRow[] {
  return [...rows]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

type SchoolClass = {
  id: string;
  grade?: number | null;
  letter: string;
  students: { acorns: number }[];
};

/** One row per class of the school (a class can be listed under several teachers). */
export function classRows(teachers: { classes: SchoolClass[] }[], ownClassId?: string): RankRow[] {
  const byId = new Map<string, SchoolClass>();
  for (const t of teachers) for (const c of t.classes) byId.set(c.id, c);
  return rankRows(
    [...byId.values()].map((c) => ({
      id: c.id,
      name: `${c.grade ?? ''}${c.letter}`,
      score: c.students.reduce((sum, s) => sum + s.acorns, 0),
      own: c.id === ownClassId,
    })),
  );
}
