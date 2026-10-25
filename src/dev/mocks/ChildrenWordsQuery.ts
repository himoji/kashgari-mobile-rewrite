// Words from the prototype's nature texts: some learned, some still being learned.
const learned = ['табиғат', 'орман', 'өзен', 'су', 'бақ', 'алма', 'ағаш', 'гүл'];
const learning = ['ауа', 'тау', 'жапырақ', 'көл'];

export default (v: { studentId: string }) => ({
  student: {
    __typename: 'Student',
    id: v.studentId,
    words: [
      ...learned.map((word, i) => ({ __typename: 'WordValue', word, level: (i % 3) + 1, isPending: false })),
      ...learning.map((word, i) => ({ __typename: 'WordValue', word, level: i % 2, isPending: true })),
    ],
  },
});
