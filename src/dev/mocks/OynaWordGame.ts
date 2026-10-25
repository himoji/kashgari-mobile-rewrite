const W = (word: string, translation: string) => ({ __typename: 'OynaGameWordGameWord', word, translation, imageUrl: null });

const full = (v: { id: string }) => ({
  wordGameGame: {
    __typename: 'OynaGameWordGame',
    id: v.id,
    name: 'Табиғат туралы жаңа сөздер',
    topicName: 'Табиғат',
    onScreenNum: 6,
    words: [W('табиғат', 'природа | nature'), W('орман', 'лес | forest'), W('өзен', 'река | river'), W('су', 'вода | water'), W('қорғау', 'защищать | protect')],
    recognize: {
      __typename: 'WordGameRecognize',
      shuffle: {
        __typename: 'GameWordShuffle',
        pairs: [
          { __typename: 'GameWordShufflePair', shuffled: 'тағибат', word: 'табиғат' },
          { __typename: 'GameWordShufflePair', shuffled: 'намор', word: 'орман' },
        ],
      },
      complete: {
        __typename: 'GameWordComplete',
        pairs: [
          { __typename: 'GameWordCompletePair', word: 'өзен', unfinished: 'ө_е_', letters: 'нкзы' },
          { __typename: 'GameWordCompletePair', word: 'табиғат', unfinished: 'т_би_ат', letters: 'ұғау' },
        ],
      },
      tiles: {
        __typename: 'GameTiles',
        tiles: [
          ['орман', true], ['кітап', false], ['өзен', true], ['қалам', false], ['тау', true], ['мектеп', false], ['гүл', true], ['дәптер', false], ['су', true],
        ].map(([word, correct]) => ({ __typename: 'GameTile', word, correct })),
      },
      grid: {
        __typename: 'GameWordGrid',
        rows: ['ОРМАНКЕТ', 'ЛТАЛМАЖЫ', 'СҚЫЗСЕРІ', 'УБАҚНЕДА', 'ПЛЕКҮЗГІ', 'ЖАЗҒЫТАҢ', 'ӨЗЕНМИДЕ', 'КӨКТЕМАР'],
        words: ['орман', 'алма', 'су', 'бақ', 'өзен'],
      },
    },
    drill: {
      __typename: 'WordGameDrill',
      captcha: {
        __typename: 'WordGameCaptcha',
        clouds: ['орман', 'кітап', 'өзен', 'қалам', 'су', 'мектеп'].map((word) => ({ __typename: 'WordGameCaptchaCloud', word })),
      },
      match: [
        ['табиғат', 'природа | nature'],
        ['орман', 'лес | forest'],
        ['өзен', 'река | river'],
        ['су', 'вода | water'],
      ].map(([word, translation]) => ({ __typename: 'WordGameMatchQuestion', word, translation })),
      mcq: [
        [W('орман', 'лес | forest'), W('өзен', 'река | river'), W('тау', 'гора | mountain')],
        [W('су', 'вода | water'), W('гүл', 'цветок | flower'), W('орман', 'лес | forest')],
        [W('қорғау', 'защищать | protect'), W('оқу', 'читать | read'), W('жазу', 'писать | write')],
      ].map((options) => ({ __typename: 'WordGameMCQQuestion', options })),
    },
  },
});

/** "g-match", "g-grid-mcq"...: only those steps (handy for checking one game on web). */
export default (v: { id: string }) => {
  const data = full(v);
  if (!v.id.startsWith('g-')) return data;
  const keep = new Set(v.id.slice(2).split('-'));
  const g = data.wordGameGame;
  const pick = <T,>(key: string, value: T) => (keep.has(key) ? value : null);
  return {
    wordGameGame: {
      ...g,
      words: keep.has('cards') ? g.words : [],
      recognize: { ...g.recognize, shuffle: pick('shuffle', g.recognize.shuffle), complete: pick('complete', g.recognize.complete), tiles: pick('tiles', g.recognize.tiles), grid: pick('grid', g.recognize.grid) },
      drill: { ...g.drill, captcha: pick('captcha', g.drill.captcha), match: pick('match', g.drill.match), mcq: pick('mcq', g.drill.mcq) },
    },
  };
};
