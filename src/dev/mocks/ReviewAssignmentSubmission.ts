import { reviewStudent } from './_review-fixtures';

export default (v: { id: string }) => ({
  submission: {
    __typename: 'Submission',
    id: v.id,
    createdAt: Math.floor(new Date(2026, 8, 29).getTime() / 1000),
    student: reviewStudent(v.id),
    assignment: { __typename: 'OqylymAssignment', id: v.id.split('-')[0], name: 'Табиғат — біздің ортақ үйіміз' },
    multipleChoice: {
      __typename: 'SubmissionMultipleChoice',
      correct: 4,
      total: 5,
      questions: [{ __typename: 'SubmissionMultipleChoiceAnswer', question: { __typename: 'GameMultipleChoiceQuestion', question: 'Оқушылар сенбі күні не істеді?' }, answer: 'Өзен жағасын тазалады' }],
    },
    trueFalse: {
      __typename: 'SubmissionTrueFalse',
      correct: 3,
      total: 4,
      questions: [{ __typename: 'SubmissionTrueFalseAnswer', question: { __typename: 'GameTrueFalseQuestion', question: 'Табиғатты қорғау — әр адамның міндеті.', answer: true }, answer: true }],
    },
    freeResponse: {
      __typename: 'SubmissionFreeResponse',
      questions: [
        {
          __typename: 'SubmissionFreeResponseAnswer',
          question: { __typename: 'GameFreeResponseQuestion', question: 'Табиғатты қорғау үшін күнделікті қандай әрекет жасай аласыз?' },
          answer: 'Мен суды үнемдеймін және қоқысты арнайы жәшікке саламын. Ағаш отырғызу да табиғатты қорғауға көмектеседі.',
          grade: null,
        },
      ],
    },
    wordShuffle: null,
    wordMatch: null,
    completeV2: null,
    wordGrid: null,
    crossword: null,
  },
});
