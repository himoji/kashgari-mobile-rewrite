const total = (n: number, typename: string) => ({ __typename: typename, total: n });

export default (v: { id: string }) => ({
  assignment: {
    __typename: 'OqylymAssignment',
    id: v.id,
    text: { __typename: 'OqylymText', id: 'nature' },
    hasFlashcards: true,
    games: {
      __typename: 'Games',
      wordShuffle: null,
      wordMatch: total(5, 'GameWordMatch'),
      completeV2: null,
      trueFalse: total(4, 'GameTrueFalse'),
      multipleChoice: total(5, 'GameMultipleChoice'),
      freeResponse: { __typename: 'GameFreeResponse', questions: [{ __typename: 'GameFreeResponseQuestion', question: 'Табиғатты қорғау үшін күнделікті қандай әрекет жасай аласыз?' }] },
      wordGrid: null,
      crossword: null,
    },
  },
});
