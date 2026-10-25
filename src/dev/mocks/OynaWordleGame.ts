export default (v: { id: string }) => ({
  wordleGame: {
    __typename: 'OynaGameWordle',
    id: v.id,
    name: 'Табиғат сөздерін тап',
    duration: 300,
    words: ['орман', 'алма', 'өзен'],
    submission: v.id.startsWith('done') ? { __typename: 'OynaSubmissionWordle', id: 'wl1' } : null,
  },
});
