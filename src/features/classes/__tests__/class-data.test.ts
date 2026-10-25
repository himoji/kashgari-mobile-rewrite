import { assignmentScore, mapClassWork, reviewItems, reviewNavigation, studentSummaries, workNumbers } from '@/features/classes/class-data';
import type { ClassWorkFragment } from '@/graphql/graphql';

const student = (id: string) => ({ __typename: 'Student' as const, id });
const mc = (correct: number, total: number) => ({ __typename: 'SubmissionMultipleChoice' as const, correct, total });

const fixture = {
  id: 'c1',
  grade: 7,
  letter: 'А',
  students: [
    { id: 's1', name: 'Аружан', durysSubmissions: [{ id: 'ds1', createdAt: 50, assignment: { id: 'd1' } }] },
    { id: 's2', name: 'Әли', durysSubmissions: [] },
  ],
  assignments: [
    {
      __typename: 'OqylymAssignment',
      id: 'a1',
      name: 'Табиғат',
      visible: true,
      deadline: 100,
      createdAt: 10,
      submissions: [
        // Older and newer attempt by s1: only the newest counts.
        { id: 'x1', createdAt: 20, student: student('s1'), multipleChoice: mc(1, 4), trueFalse: null, wordShuffle: null, wordMatch: null, completeV2: null, wordGrid: null, crossword: null, freeResponse: null },
        { id: 'x2', createdAt: 30, student: student('s1'), multipleChoice: mc(3, 4), trueFalse: mc(1, 1), wordShuffle: null, wordMatch: null, completeV2: null, wordGrid: null, crossword: null, freeResponse: null },
        { id: 'x3', createdAt: 25, student: student('s2'), multipleChoice: mc(2, 4), trueFalse: null, wordShuffle: null, wordMatch: null, completeV2: null, wordGrid: null, crossword: null, freeResponse: { questions: [{ answer: 'жауап', grade: null }] } },
      ],
    },
    { __typename: 'TyndalymAssignment', id: 'a2', name: 'Жоба', visible: false, deadline: 100, createdAt: 40, submissions: [] },
  ],
  zhazylymAssignments: [
    { __typename: 'WordZhazylym', id: 'z1', name: 'Бақ', deadline: 100, opensAt: 1, createdAt: 15, submissions: [{ id: 'zs1', createdAt: 35, points: null, student: student('s2') }, { id: 'zs2', createdAt: 36, points: 7, student: student('s1') }] },
  ],
  oynaGames: [
    { __typename: 'OynaGameWordle', id: 'g1', name: 'Сөзді тап', createdAt: 12, maxPoints: 50, submissions: [{ id: 'gs1', createdAt: 40, points: 25, student: student('s1') }] },
  ],
  durysAssignments: [{ id: 'd1', createdAt: 11, durysTitle: { id: 't1', title: 'Тәуелдік' } }],
  lessons: [{ id: 'l1', name: 'Сабақ', visible: true, opensAt: 2000, activitiesType: ['oqylym', 'wordle'], students: [student('s2')], submissions: [{ createdAt: null, student: student('s2') }] }],
} as unknown as ClassWorkFragment;

describe('assignmentScore', () => {
  it('sums correct over total across exercises', () => {
    expect(assignmentScore([mc(3, 4), null, mc(1, 1)])).toBe(80);
  });
  it('is null when there is nothing to score', () => {
    expect(assignmentScore([null, undefined, mc(0, 0)])).toBeNull();
  });
});

describe('mapClassWork', () => {
  const c = mapClassWork(fixture, 1000);
  const work = (key: string) => c.works.find((w) => w.key === key)!;

  it('names the class and sorts works newest first', () => {
    expect(c.name).toBe('7А');
    expect(c.works[0]!.key).toBe('lesson:l1');
    expect(c.works.map((w) => w.key)).toContain('durys:d1');
  });

  it('keeps the latest attempt per student and scores it', () => {
    const a1 = work('oqylym:a1');
    expect(a1.attempts.map((a) => a.id)).toEqual(['x2', 'x3']);
    expect(a1.attempts[0]!.score).toBe(80);
    expect(a1.attempts[1]!.pending).toBe(true); // unscored open answer
    expect(workNumbers(a1)).toEqual({ total: 2, done: 2, pending: 1, pct: 100 });
  });

  it('maps statuses', () => {
    expect(work('tyndalym:a2').status).toBe('draft');
    expect(work('lesson:l1').status).toBe('scheduled');
    expect(work('zhazylym:z1').status).toBe('published');
  });

  it('scores manual work out of 10 and games out of maxPoints', () => {
    const z = work('zhazylym:z1');
    expect(z.attempts.find((a) => a.id === 'zs1')).toMatchObject({ pending: true, score: null });
    expect(z.attempts.find((a) => a.id === 'zs2')).toMatchObject({ pending: false, score: 70 });
    expect(work('oyna:g1').attempts[0]).toMatchObject({ score: 50, reviewKind: 'wordle' });
  });

  it('counts grammar from student submissions and lessons only for their students', () => {
    expect(work('durys:d1').attempts).toHaveLength(1);
    const lesson = work('lesson:l1');
    expect(lesson.studentIds).toEqual(['s2']);
    expect(lesson.attempts).toHaveLength(0);
    expect(lesson.contents).toEqual(['reading', 'wordle']);
  });

  it('summarises students without drafts', () => {
    const [s1, s2] = studentSummaries(c);
    expect(s1).toMatchObject({ submitted: 4, eligible: 4, average: 67 });
    expect(s2).toMatchObject({ submitted: 2, eligible: 5, average: null });
  });

  it('builds the review queue and navigation', () => {
    const items = reviewItems([c]);
    expect(items.filter((i) => i.attempt.pending).map((i) => i.attempt.id).sort()).toEqual(['x3', 'zs1']);
    expect(items.some((i) => i.work.kind === 'durys')).toBe(false);
    const nav = reviewNavigation(work('zhazylym:z1'), 'zs2');
    expect(nav.index).toBe(0);
    expect(nav.next?.id).toBe('zs1');
    expect(nav.nextPending?.id).toBe('zs1');
  });
});
