import { assignment, durys, lessonName, lessonOpensAt, now, submission, zhazylym } from './_player-fixtures';

export default ({ id }: { id: string }) => ({
  lesson: {
    __typename: 'Lesson',
    id,
    name: lessonName(id),
    opensAt: lessonOpensAt(id),
    submission: { __typename: 'LessonSubmission', createdAt: now() - 86400 },
    activities: [
      {
        __typename: 'TextActivity',
        moduleName: 'Oqylym',
        text: { __typename: 'OqylymText', id: `t-${id}`, assignment: { ...assignment(`${id}-text`), submission: submission(`${id}-text`, false) } },
      },
      { __typename: 'DurysActivity', assignment: { ...durys(`${id}-durys`), submission: true } },
      {
        __typename: 'OynaActivity',
        game: { __typename: 'OynaGameQuizlet', id: 'a5', name: 'Табиғат сөздері', submission: { __typename: 'OynaSubmissionQuizlet', id: 'os5', points: 80, createdAt: now() - 86400 } },
      },
      {
        __typename: 'ZhazylymActivity',
        zhazylym: {
          ...zhazylym('z-l1'),
          submission: { __typename: 'ZhazylymSubmission', id: 'zs-l1', createdAt: now() - 86400, text: 'Мен табиғатты қорғаймын. Суды үнемдеймін.', points: 9 },
        },
      },
    ],
  },
});
