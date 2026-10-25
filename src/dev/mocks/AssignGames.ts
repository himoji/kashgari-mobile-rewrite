// Generated exercises for the prototype's nature text (content.js exercises()).
export default () => ({
  generateGames: {
    __typename: 'Games',
    wordShuffle: { __typename: 'GameWordShuffle', pairs: [{ __typename: 'GameWordShufflePair', shuffled: 'МОНРА', word: 'ОРМАН' }] },
    wordMatch: {
      __typename: 'GameWordMatch',
      pairs: [
        { __typename: 'GameWordMatchPair', word: 'табиғат', translation: 'природа' },
        { __typename: 'GameWordMatchPair', word: 'орман', translation: 'лес' },
        { __typename: 'GameWordMatchPair', word: 'өзен', translation: 'река' },
      ],
    },
    completeV2: { __typename: 'GameCompleteV2', sentences: [{ __typename: 'GameCompleteV2Sentence', before: 'Табиғат —', after: 'ортақ үйіміз.', wordGroup: ['біздің'] }] },
    trueFalse: { __typename: 'GameTrueFalse', questions: [{ __typename: 'GameTrueFalseQuestion', question: 'Табиғатты қорғау — әр адамның міндеті.', answer: true }] },
    multipleChoice: {
      __typename: 'GameMultipleChoice',
      questions: [{ __typename: 'GameMultipleChoiceQuestion', question: 'Оқушылар сенбі күні не істеді?', options: ['Өзен жағасын тазалады', 'Кітап дүкеніне барды', 'Тауда демалды'] }],
    },
    freeResponse: { __typename: 'GameFreeResponse', questions: [{ __typename: 'GameFreeResponseQuestion', question: 'Табиғатты қорғау үшін күнделікті қандай әрекет жасай аласыз?' }] },
    wordGrid: { __typename: 'GameWordGrid', rows: ['АЛМАҚОСА', 'ТБСУОРМА', 'ААҒАШДОС', 'СҚАРТАУЛ', 'ОРМАНБАҚ', 'ҚӨЗЕНАЛА', 'ТКІТАПСУ', 'БАҚАУЛАМ'], words: ['АЛМА', 'БАҚ', 'СУ'] },
    crossword: null,
  },
});
