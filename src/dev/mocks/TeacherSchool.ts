// Sample data from the Donatien prototype (content.js): classes 7А and 5Б, the teacher's works and answers.
const day = (d: number, month = 9) => Math.floor(new Date(2026, month, d, 12).getTime() / 1000);
const now = Math.floor(Date.now() / 1000);

type Ref = { id: string; name: string };
const c7a: Ref[] = ['Аружан Сейіт', 'Әли Нұрлан', 'Айша Мұрат', 'Данияр Әсет', 'Медина Омар', 'Ерасыл Қанат', 'Томирис Әлі', 'Нұрислам Бек'].map(
  (name, i) => ({ id: `s${i}`, name }),
);
const c5b: Ref[] = ['Айым Ермек', 'Арман Сәкен', 'Мирас Орал', 'Асыл Мұхамед'].map((name, i) => ({ id: `s5b${i}`, name }));

// Newest first in the list = the prototype's order.
let order = 0;
const created = () => day(20) - order++ * 3600;

const student = (s: Ref) => ({ __typename: 'Student', id: s.id });

/** Reading / listening answers: `pct` per student (multiple choice out of 100), optional unscored open answer. */
function assignment(typename: 'OqylymAssignment' | 'TyndalymAssignment', id: string, name: string, deadline: number, roster: Ref[], scores: number[], answeredAt: number, frq = false, visible = true) {
  return {
    __typename: typename,
    id,
    name,
    visible,
    deadline,
    createdAt: created(),
    submissions: scores.map((pct, i) => ({
      __typename: 'Submission',
      id: `${id}-sub${i}`,
      createdAt: answeredAt,
      student: student(roster[i]!),
      wordShuffle: null,
      wordMatch: null,
      completeV2: null,
      trueFalse: null,
      multipleChoice: { __typename: 'SubmissionMultipleChoice', correct: pct, total: 100 },
      wordGrid: null,
      crossword: null,
      freeResponse: frq
        ? { __typename: 'SubmissionFreeResponse', questions: [{ __typename: 'SubmissionFreeResponseAnswer', answer: 'Мен суды үнемдеймін.', grade: null }] }
        : null,
    })),
  };
}

function game(typename: string, id: string, name: string, roster: Ref[], points: (number | null)[], answeredAt: number, maxPoints = 100) {
  const sub = typename.replace('OynaGame', 'OynaSubmission');
  return {
    __typename: typename,
    id,
    name,
    createdAt: created(),
    maxPoints,
    submissions: points.map((p, i) => ({ __typename: sub, id: `${id}-sub${i}`, createdAt: answeredAt, points: p, student: student(roster[i]!) })),
  };
}

export default () => {
  order = 0;
  const a1 = assignment('OqylymAssignment', 'a1', 'Табиғат — біздің ортақ үйіміз', day(4), c7a, [80, 75, 70, 65, 60, 55], day(29, 8), true);
  const a2 = assignment('TyndalymAssignment', 'a2', 'Алматыдағы бір күн', day(5), c7a, [91, 87, 76, 79, 75, 71, 57, 63], day(30, 8));
  const g1 = game('OynaGameWordle', 'g1', 'Табиғат сөздерін тап', c7a, [86, 78, 74, 70, 62, 58], day(29, 8));
  const d1 = { __typename: 'DurysAssignment', id: 'd1', createdAt: created(), durysTitle: { __typename: 'DurysTitle', id: 't1', title: 'Тәуелдік жалғауы' } };
  const g2 = game('OynaGameQuizlet', 'g2', 'Сөздер мен мағыналар', c7a, [], 0);
  const z1 = {
    __typename: 'WordZhazylym',
    id: 'z1',
    name: 'Бақтағы бір күн',
    deadline: day(7),
    opensAt: day(1),
    createdAt: created(),
    submissions: [null, null, 8].map((points, i) => ({ __typename: 'ZhazylymSubmission', id: `z1-sub${i}`, createdAt: day(6), points, student: student(c7a[i]!) })),
  };
  const g3 = game('OynaGameWordGame', 'g3', 'Табиғат туралы жаңа сөздер', c7a, [], 0);
  const a3 = assignment('OqylymAssignment', 'a3', 'Атамның бағы', day(5), c5b, [64, 60, 56], day(29, 8));
  const a4 = assignment('OqylymAssignment', 'a4', 'Сурет бойынша әңгіме', day(9), c7a, [], 0, false, false);
  const l1 = {
    __typename: 'Lesson',
    id: 'l1',
    name: 'Табиғат және адам',
    visible: true,
    opensAt: day(7),
    activitiesType: ['oqylym', 'wordle', 'quizlet', 'zhazylym', 'durys_assignment', 'oqylym', 'tyndalym', 'miniStory', 'wordGame', 'oqylym'],
    students: c7a.map(student),
    submissions: [],
  };
  const l2 = {
    __typename: 'Lesson',
    id: 'l2',
    name: 'Қаладағы саяхат',
    visible: true,
    opensAt: now + 7 * 86400,
    activitiesType: ['oqylym', 'quizlet', 'wordle', 'zhazylym'],
    students: c7a.slice(0, 4).map(student),
    submissions: [],
  };
  // Lessons sort by opensAt; keep them at the end of the list like the prototype.
  l1.opensAt = Math.min(l1.opensAt, created());
  const ms = game('OynaGameMiniStory', 'm1', 'Менің сүйікті мезгілім', c7a, [null, 7], day(8), 10);

  return {
    teacher: {
      __typename: 'Teacher',
      id: 'p1',
      school: { __typename: 'School', id: 'school1', name: '№ 125 мектеп-лицей' },
      classes: [
        {
          __typename: 'Class',
          id: 'c1',
          grade: 7,
          letter: 'А',
          students: c7a.map((s, i) => ({
            __typename: 'Student',
            ...s,
            durysSubmissions:
              i < 5 ? [{ __typename: 'DurysSubmission', id: `d1-sub${i}`, createdAt: day(30, 8), assignment: { __typename: 'DurysAssignment', id: 'd1' } }] : [],
          })),
          assignments: [a1, a2, a4],
          zhazylymAssignments: [z1],
          oynaGames: [g1, g2, g3, ms],
          durysAssignments: [d1],
          lessons: [l1, l2],
        },
        {
          __typename: 'Class',
          id: 'c2',
          grade: 5,
          letter: 'Б',
          students: c5b.map((s) => ({ __typename: 'Student', ...s, durysSubmissions: [] })),
          assignments: [a3],
          zhazylymAssignments: [],
          oynaGames: [],
          durysAssignments: [],
          lessons: [],
        },
      ],
    },
  };
};
