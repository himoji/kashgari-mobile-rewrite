const sub = (id: string, answer: string | null, grade: number | null) => ({
  __typename: 'Submission',
  id,
  freeResponse: { __typename: 'SubmissionFreeResponse', questions: [{ __typename: 'SubmissionFreeResponseAnswer', answer, grade }] },
});

export default () => ({
  teacher: {
    __typename: 'Teacher',
    id: 't1',
    name: 'Айгүл Қасымова',
    classes: [
      {
        __typename: 'Class',
        id: 'c7a',
        assignments: [
          { __typename: 'OqylymAssignment', id: 'a1', submissions: [sub('s1', 'Ағаш отырғызамын', null), sub('s2', 'Суды үнемдеймін', null), sub('s3', 'Қоқысты сұрыптаймын', 5)] },
        ],
        zhazylymAssignments: [
          { __typename: 'WordZhazylym', id: 'z1', submissions: [{ __typename: 'ZhazylymSubmission', id: 'zs1', points: null }, { __typename: 'ZhazylymSubmission', id: 'zs2', points: null }] },
        ],
        oynaGames: [
          { __typename: 'OynaGameMiniStory', id: 'm1', submissions: [{ __typename: 'OynaSubmissionMiniStory', id: 'ms1', points: null }, { __typename: 'OynaSubmissionMiniStory', id: 'ms2', points: null }] },
        ],
      },
    ],
  },
});
