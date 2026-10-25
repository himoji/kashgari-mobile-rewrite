import { mapClassWork } from '@/features/classes/class-data';
import { activityBuckets, periodStart } from '@/features/reports/period';
import { pointsPercent, workReport } from '@/features/reports/report-data';
import type { ClassWorkFragment } from '@/graphql/graphql';

const at = (y: number, m: number, d: number) => Math.floor(new Date(y, m, d).getTime() / 1000);

describe('periodStart', () => {
  const now = new Date(2026, 9, 22, 15); // Thursday 22 Oct 2026
  it('starts weeks on Monday and months on the 1st', () => {
    expect(periodStart('week', now)).toBe(at(2026, 9, 19));
    expect(periodStart('month', now)).toBe(at(2026, 9, 1));
  });
  it('uses school quarters', () => {
    expect(periodStart('quarter', now)).toBe(at(2026, 8, 1));
    expect(periodStart('quarter', new Date(2026, 11, 5))).toBe(at(2026, 10, 1));
    expect(periodStart('quarter', new Date(2027, 1, 5))).toBe(at(2027, 0, 1));
    expect(periodStart('allTime', now)).toBeNull();
  });
  it('splits the period into five contiguous buckets ending now', () => {
    const b = activityBuckets('month', now);
    expect(b).toHaveLength(5);
    expect(b[4]!.before).toBe(Math.floor(now.getTime() / 1000));
    expect(b[1]!.after).toBe(b[0]!.before);
  });
});

describe('workReport', () => {
  const sub = (id: string, s: string, createdAt: number) => ({ id, createdAt, points: 5, student: { id: s } });
  const c = mapClassWork(
    {
      id: 'c1',
      grade: 7,
      letter: 'А',
      students: [{ id: 's1', name: 'A', durysSubmissions: [] }, { id: 's2', name: 'B', durysSubmissions: [] }],
      assignments: [],
      zhazylymAssignments: [{ __typename: 'WordZhazylym', id: 'z1', name: 'z', deadline: 0, opensAt: 0, createdAt: 100, submissions: [sub('a', 's1', 150), sub('b', 's2', 50)] }],
      oynaGames: [{ __typename: 'OynaGameWordle', id: 'g1', name: 'g', createdAt: 10, maxPoints: 10, submissions: [sub('c', 's1', 120)] }],
      durysAssignments: [],
      lessons: [],
    } as unknown as ClassWorkFragment,
    0,
  );

  it('counts submissions, active students and modules since the period start', () => {
    const r = workReport([c], 100);
    expect(r).toMatchObject({ activeStudents: 1, workAssigned: 1, submissions: 2 });
    expect(r.modules.find((m) => m.key === 'writing')).toEqual({ key: 'writing', count: 1, pct: 50 });
    expect(r.modules.find((m) => m.key === 'game')).toEqual({ key: 'game', count: 1, pct: 50 });
  });

  it('converts points to a percentage', () => {
    expect(pointsPercent({ points: 7, maxPoints: 10 })).toBe(70);
    expect(pointsPercent({ points: 0, maxPoints: 0 })).toBeNull();
  });
});
