import childrenFixture from '@/dev/mocks/Children';
import assignmentsFixture from '@/dev/mocks/StudentAssignments';
import { mapAssignments, type StudentAssignment } from '@/features/assignments/map';
import { mapChildren, moduleAssignments, moduleBreakdown, recentAssignments, splitWords } from '@/features/children/children-data';
import type { ChildrenQuery, StudentAssignmentsQuery } from '@/graphql/graphql';

const parent = (childrenFixture() as unknown as ChildrenQuery).parent!;
const now = Date.now() / 1000;
const all = mapAssignments((assignmentsFixture() as unknown as StudentAssignmentsQuery).student!.class, now);

describe('mapChildren', () => {
  it('turns every student profile of every child account into a child', () => {
    expect(mapChildren(parent)).toEqual([
      { id: 's0', name: 'Аружан Сейіт', className: '7А', schoolName: '№ 125 мектеп-лицей', teacherName: 'Айгүл Қасымова', streak: 5, level: 'A2' },
      { id: 's5b2', name: 'Мирас Орал', className: '5Б', schoolName: '№ 125 мектеп-лицей', teacherName: 'Айгүл Қасымова', streak: 2, level: 'A1' },
    ]);
  });

  it('is empty without a parent profile', () => {
    expect(mapChildren(null)).toEqual([]);
  });
});

describe('moduleBreakdown', () => {
  it('counts done work and averages scores per module, in module order, skipping empty modules', () => {
    expect(moduleBreakdown(all)).toEqual([
      { kind: 'tyndalym', total: 1, done: 1, average: 91 },
      { kind: 'durys', total: 1, done: 0, average: undefined },
      { kind: 'oyna', total: 3, done: 1, average: 86 },
      { kind: 'zhazylym', total: 3, done: 1, average: undefined },
      { kind: 'lesson', total: 2, done: 0, average: undefined },
    ]);
  });
});

describe('ordering', () => {
  const item = (id: string, state: StudentAssignment['state'], createdAt: number, submittedAt?: number): StudentAssignment => ({
    id,
    kind: 'oqylym',
    title: id,
    state,
    status: 'pending',
    createdAt,
    submittedAt,
  });
  const list = [item('old-open', 'notStarted', 10), item('done-late', 'done', 5, 50), item('new-open', 'overdue', 30), item('waiting', 'waiting', 1, 20)];

  it('recent work: newest activity first', () => {
    expect(recentAssignments(list, 3).map((a) => a.id)).toEqual(['done-late', 'new-open', 'waiting']);
  });

  it('module page: open work first, then completed', () => {
    expect(moduleAssignments(list, 'oqylym').map((a) => a.id)).toEqual(['new-open', 'old-open', 'done-late', 'waiting']);
    expect(moduleAssignments(list, 'durys')).toEqual([]);
  });
});

describe('splitWords', () => {
  it('splits learned and pending words, alphabetically', () => {
    const words = [
      { word: 'су', level: 1, isPending: false },
      { word: 'ауа', level: 0, isPending: true },
      { word: 'алма', level: 2, isPending: false },
    ];
    expect(splitWords(words)).toEqual({ learned: [{ word: 'алма', level: 2 }, { word: 'су', level: 1 }], learning: [{ word: 'ауа', level: 0 }] });
  });
});
