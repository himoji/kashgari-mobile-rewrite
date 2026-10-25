import { countAwaitingReview, firstName } from '@/features/teacher-home/review-count';

const cls = (over: Record<string, unknown> = {}) => ({
  __typename: 'Class' as const,
  id: 'c',
  assignments: [],
  zhazylymAssignments: [],
  oynaGames: [],
  ...over,
});

describe('countAwaitingReview', () => {
  it('is zero without a teacher', () => {
    expect(countAwaitingReview(null)).toBe(0);
  });

  it('counts ungraded open answers once per submission, ungraded writing and mini stories', () => {
    const teacher = {
      classes: [
        cls({
          assignments: [
            {
              id: 'a',
              submissions: [
                { id: 's1', freeResponse: { questions: [{ answer: 'x', grade: null }, { answer: 'y', grade: null }] } },
                { id: 's2', freeResponse: { questions: [{ answer: 'x', grade: 4 }] } },
                { id: 's3', freeResponse: { questions: [{ answer: null, grade: null }] } },
                { id: 's4', freeResponse: null },
              ],
            },
          ],
          zhazylymAssignments: [{ id: 'z', submissions: [{ id: 'z1', points: null }, { id: 'z2', points: 3 }] }],
          oynaGames: [
            { __typename: 'OynaGameMiniStory', id: 'm', submissions: [{ id: 'm1', points: null }] },
            { __typename: 'OynaGameWordle', id: 'w' },
          ],
        }),
      ],
    };
    expect(countAwaitingReview(teacher as never)).toBe(3);
  });
});

describe('firstName', () => {
  it('takes the first word', () => {
    expect(firstName(' Айгүл  Қасымова ')).toBe('Айгүл');
  });
});
