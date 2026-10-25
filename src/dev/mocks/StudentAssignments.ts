// Modelled on the prototype's student works (content.js): 7 new, 3 completed.
const DAY = 86400;
const now = () => Math.floor(Date.now() / 1000);

const games = (correct: number, total: number) => ({
  wordShuffle: null,
  wordMatch: null,
  trueFalse: null,
  multipleChoice: { __typename: 'SubmissionMultipleChoice', total, correct },
  wordGrid: null,
  crossword: null,
  completeV2: null,
});

const lesson = (id: string, name: string, minutes: number[], openedDaysAgo: number) => ({
  __typename: 'Lesson',
  id,
  name,
  visible: true,
  opensAt: now() - openedDaysAgo * DAY,
  activities: minutes.map((m) => ({ __typename: 'OynaActivity', estTime: m })),
  submission: { __typename: 'LessonSubmission', submissions: minutes.map(() => null) },
});

export default () => {
  const t = now();
  return {
    student: {
      __typename: 'Student',
      id: 'p1',
      class: {
        __typename: 'Class',
        id: 'c7a',
        assignments: [
          {
            __typename: 'TyndalymAssignment',
            id: 'a2',
            name: 'Алматыдағы бір күн',
            visible: true,
            deadline: t - 1 * DAY,
            duration: 720,
            createdAt: t - 6 * DAY,
            submission: { __typename: 'Submission', id: 'sub2', createdAt: t - 2 * DAY, ...games(10, 11) },
          },
        ],
        zhazylymAssignments: [
          {
            __typename: 'WordZhazylym',
            id: 'a1',
            name: 'Табиғат — біздің ортақ үйіміз',
            deadline: t + 2 * DAY,
            duration: 900,
            opensAt: t - 5 * DAY,
            createdAt: t - 5 * DAY,
            submission: { __typename: 'ZhazylymSubmission', id: 'zs1', createdAt: t - 1 * DAY, points: null },
          },
          {
            __typename: 'WordZhazylym',
            id: 'a7',
            name: 'Бақтағы бір күн',
            deadline: t - 24 * DAY,
            duration: 600,
            opensAt: t - 30 * DAY,
            createdAt: t - 30 * DAY,
            submission: null,
          },
          {
            __typename: 'ImageZhazylym',
            id: 'a9',
            name: 'Мен табиғатты қалай қорғаймын?',
            deadline: t + 4 * DAY,
            duration: 900,
            opensAt: t - 1 * DAY,
            createdAt: t - 1 * DAY,
            submission: null,
          },
        ],
        oynaGames: [
          {
            __typename: 'OynaGameQuizlet',
            id: 'a5',
            name: 'Сөздер мен мағыналар',
            duration: 180,
            maxPoints: 12,
            createdAt: t - 1 * DAY,
            submission: null,
          },
          {
            __typename: 'OynaGameWordGame',
            id: 'a8',
            name: 'Табиғат туралы жаңа сөздер',
            duration: 480,
            maxPoints: 40,
            createdAt: t - 2 * DAY,
            submission: null,
          },
          {
            __typename: 'OynaGameWordle',
            id: 'a6',
            name: 'Табиғат сөздерін тап',
            duration: 300,
            maxPoints: 100,
            createdAt: t - 8 * DAY,
            submission: { __typename: 'OynaSubmissionWordle', id: 'os6', createdAt: t - 7 * DAY, points: 86 },
          },
        ],
        durysAssignments: [
          { __typename: 'DurysAssignment', id: 'a4', createdAt: t - 3 * DAY, durysTitle: { __typename: 'DurysTitle', id: 'dt4', title: 'Тәуелдік жалғауы' }, submission: false },
        ],
        lessons: [lesson('l1', 'Табиғат және адам', [20, 15, 10], 3), lesson('l3', 'Қаладағы саяхат', [20, 10], 4)],
      },
    },
  };
};
