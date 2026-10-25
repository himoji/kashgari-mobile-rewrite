const C = (word: string, translation: string) => ({ __typename: 'OynaGameQuizletWord', word, translation });
const S = (id: string, name: string, points: number, time: number) => ({ __typename: 'OynaSubmissionQuizlet', id: `s-${id}`, points, time, student: { __typename: 'Student', id, name } });

export default (v: { id: string }) => ({
  quizletGame: {
    __typename: 'OynaGameQuizlet',
    id: v.id,
    name: 'Сөздер мен мағыналар',
    maxPoints: 7,
    boards: [
      [C('табиғат', 'природа | nature'), C('орман', 'лес | forest'), C('өзен', 'река | river'), C('су', 'вода | water')],
      [C('тау', 'гора | mountain'), C('гүл', 'цветок | flower'), C('ағаш', 'дерево | tree')],
    ],
    submission: { __typename: 'OynaSubmissionQuizlet', id: 'q1', time: 96, points: 6, guessed: [['табиғат', 'орман', 'өзен', 'су'], ['тау', 'гүл']] },
    submissions: [S('p1', 'Аружан Сейіт', 6, 96), S('s2', 'Әли Нұрлан', 7, 120), S('s3', 'Данияр Ахмет', 5, 150)],
  },
});
