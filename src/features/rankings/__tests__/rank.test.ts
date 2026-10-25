import { classRows, rankRows } from '@/features/rankings/rank';

describe('rankRows', () => {
  it('sorts by score then name and numbers positions', () => {
    const rows = rankRows([
      { id: 'a', name: 'Ерасыл', score: 50, own: false },
      { id: 'b', name: 'Аружан', score: 0, own: true },
      { id: 'c', name: 'Айша', score: 50, own: false },
    ]);
    expect(rows.map((r) => [r.id, r.rank])).toEqual([
      ['c', 1],
      ['a', 2],
      ['b', 3],
    ]);
  });
});

describe('classRows', () => {
  it('sums acorns per class and drops duplicate classes', () => {
    const c7a = { id: '7a', grade: 7, letter: 'А', students: [{ acorns: 10 }, { acorns: 5 }] };
    const rows = classRows(
      [
        { classes: [c7a, { id: '8b', grade: 8, letter: 'Б', students: [{ acorns: 30 }] }] },
        { classes: [c7a] },
      ],
      '7a',
    );
    expect(rows).toEqual([
      { id: '8b', name: '8Б', score: 30, own: false, rank: 1 },
      { id: '7a', name: '7А', score: 15, own: true, rank: 2 },
    ]);
  });
});
