// Oyna word game: ids starting with "done" are already submitted.
export default (v: { id: string }) => ({
  wordGameGame: {
    __typename: 'OynaGameWordGame',
    id: v.id,
    name: 'Табиғат туралы жаңа сөздер',
    submission: v.id.startsWith('done') ? { __typename: 'OynaSubmissionWordGame', id: 'ws1', time: 412 } : null,
  },
});
