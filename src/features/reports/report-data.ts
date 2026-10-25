import type { ClassWork, WorkKind } from '@/features/classes/class-data';

export type ModuleKey = 'reading' | 'listening' | 'grammar' | 'game' | 'writing';
export const MODULES: ModuleKey[] = ['reading', 'listening', 'grammar', 'game', 'writing'];
const MODULE_OF: Partial<Record<WorkKind, ModuleKey>> = {
  oqylym: 'reading',
  tyndalym: 'listening',
  durys: 'grammar',
  oyna: 'game',
  zhazylym: 'writing',
};

export interface WorkReport {
  activeStudents: number;
  workAssigned: number;
  submissions: number;
  modules: { key: ModuleKey; count: number; pct: number }[];
}

/** KPI tiles and module usage from the teacher's works, for submissions made since `after` (null: all time). */
export function workReport(classes: ClassWork[], after: number | null): WorkReport {
  const since = after ?? 0;
  const works = classes.flatMap((c) => c.works).filter((w) => w.status !== 'draft');
  const attempts = works.flatMap((w) => w.attempts.filter((a) => a.createdAt >= since).map((a) => ({ a, module: MODULE_OF[w.kind] })));
  const counted = attempts.filter((x) => x.module);
  return {
    activeStudents: new Set(attempts.map((x) => x.a.studentId)).size,
    workAssigned: works.filter((w) => w.createdAt >= since).length,
    submissions: attempts.length,
    modules: MODULES.map((key) => {
      const count = counted.filter((x) => x.module === key).length;
      return { key, count, pct: counted.length ? Math.round((count / counted.length) * 100) : 0 };
    }),
  };
}

const csvCell = (v: string | number) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/** "CSV жүктеу": one row per submission since `after`, like the design's export. */
export function reportCsv(
  classes: ClassWork[],
  after: number | null,
  labels: { header: string[]; pending: string; done: string; date: (unix: number) => string },
): string {
  const since = after ?? 0;
  const rows = classes.flatMap((c) => {
    const names = new Map(c.students.map((s) => [s.id, s.name]));
    return c.works
      .filter((w) => w.status !== 'draft')
      .flatMap((w) =>
        w.attempts
          .filter((a) => a.createdAt >= since)
          .map((a) => [names.get(a.studentId) ?? '', c.name, w.name, a.score ?? '', a.pending ? labels.pending : labels.done, labels.date(a.createdAt)]),
      );
  });
  return [labels.header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Average score from the stats resolver, null when nothing was scored. */
export const pointsPercent = (p: { points: number; maxPoints: number } | undefined) =>
  p && p.maxPoints > 0 ? Math.round((p.points / p.maxPoints) * 100) : null;
