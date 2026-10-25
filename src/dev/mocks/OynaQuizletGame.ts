const C = (word: string, translation: string) => ({ __typename: 'OynaGameQuizletWord', word, translation, imageUrl: null });

export default (v: { id: string }) => ({
  quizletGame: {
    __typename: 'OynaGameQuizlet',
    id: v.id,
    name: 'Сөздер мен мағыналар',
    duration: 180,
    dataType: 'TRANSLATION',
    boards: [
      [C('табиғат', 'природа | nature'), C('орман', 'лес | forest'), C('өзен', 'река | river'), C('су', 'вода | water')],
      [C('тау', 'гора | mountain'), C('гүл', 'цветок | flower'), C('ағаш', 'дерево | tree')],
    ],
    submission: v.id.startsWith('done') ? { __typename: 'OynaSubmissionQuizlet', id: 'q1' } : null,
  },
});
