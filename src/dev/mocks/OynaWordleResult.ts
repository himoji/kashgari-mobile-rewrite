const S = (id: string, name: string, points: number, time: number) => ({ __typename: 'OynaSubmissionWordle', id: `s-${id}`, points, time, student: { __typename: 'Student', id, name } });

export default (v: { id: string }) => ({
  wordleGame: {
    __typename: 'OynaGameWordle',
    id: v.id,
    name: 'Табиғат сөздерін тап',
    words: ['ОРМАН', 'АЛМА', 'ӨЗЕН'],
    maxPoints: 3,
    submission: { __typename: 'OynaSubmissionWordle', id: 'wl1', time: 145, points: 2, guesses: [['НОРМА', 'ОРМАН'], ['АЛМА'], ['ЕЗЕН', 'ӨЗЕК', 'ӨРЕН', 'ӨТЕН', 'ӨМЕН', 'ӨЗЕР']] },
    submissions: [S('p1', 'Аружан Сейіт', 2, 145), S('s2', 'Әли Нұрлан', 3, 210), S('s3', 'Данияр Ахмет', 2, 180), S('s4', 'Айша Қали', 1, 95)],
  },
});
