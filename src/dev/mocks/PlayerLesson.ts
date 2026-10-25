import { assignment, durys, lessonName, lessonOpensAt, zhazylym } from './_player-fixtures';

export default ({ id }: { id: string }) => ({
  lesson: {
    __typename: 'Lesson',
    id,
    name: lessonName(id),
    opensAt: lessonOpensAt(id),
    submission: null,
    activities: [
      {
        __typename: 'TextActivity',
        moduleName: 'Oqylym',
        text: { __typename: 'OqylymText', id: `t-${id}`, assignment: { ...assignment(`${id}-text`), submission: null } },
      },
      { __typename: 'DurysActivity', assignment: { ...durys(`${id}-durys`), submission: false } },
      {
        __typename: 'OynaActivity',
        game: { __typename: 'OynaGameQuizlet', id: 'a5', name: 'Табиғат сөздері', submission: null },
      },
      { __typename: 'ZhazylymActivity', zhazylym: { ...zhazylym('z-l1'), submission: null } },
    ],
  },
});
