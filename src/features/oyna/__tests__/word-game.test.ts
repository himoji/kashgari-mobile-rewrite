import {
  chunk,
  emptyMatch,
  fillGap,
  gridWordAt,
  lineBetween,
  locateWord,
  matchPayload,
  mcqPayload,
  parsePattern,
  pickMatch,
  slotsFilled,
  slotsWord,
  tilesPageDone,
  wordSteps,
} from '@/features/oyna/logic/word-game';

describe('wordSteps', () => {
  it('keeps only the games the API returned, in play order', () => {
    expect(
      wordSteps({
        words: [{}],
        recognize: { shuffle: { pairs: [{}] }, complete: { pairs: [] }, tiles: null, grid: { rows: ['АБ'], words: ['АБ'] } },
        drill: { captcha: { clouds: [] }, match: [{}], mcq: [{}] },
      }),
    ).toEqual(['cards', 'shuffle', 'grid', 'match', 'mcq']);
  });
});

describe('fill-in pattern', () => {
  it('fills gaps left to right', () => {
    let slots = parsePattern('т_би_ат');
    expect(slots).toEqual(['т', null, 'б', 'и', null, 'а', 'т']);
    slots = fillGap(slots, 'а');
    expect(slotsFilled(slots)).toBe(false);
    slots = fillGap(slots, 'ғ');
    expect(slotsFilled(slots)).toBe(true);
    expect(slotsWord(slots)).toBe('табиғат');
    expect(fillGap(slots, 'x')).toEqual(slots);
  });
});

describe('tiles', () => {
  it('pages by nine and finishes a page when every correct tile is picked', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    const page = [{ correct: true }, { correct: false }, { correct: true }];
    expect(tilesPageDone(page, new Set([0]))).toBe(false);
    expect(tilesPageDone(page, new Set([0, 2]))).toBe(true);
  });
});

describe('word grid', () => {
  const rows = ['АЛМАХ', 'ХХСХХ', 'ХХУХХ', 'ҚАБХХ'];
  it('builds straight lines only', () => {
    expect(lineBetween({ row: 0, col: 3 }, { row: 0, col: 0 })).toHaveLength(4);
    expect(lineBetween({ row: 1, col: 2 }, { row: 2, col: 2 })).toEqual([{ row: 1, col: 2 }, { row: 2, col: 2 }]);
    expect(lineBetween({ row: 0, col: 0 }, { row: 1, col: 1 })).toBeNull();
  });
  it('finds words in either direction, once', () => {
    const words = ['алма', 'су', 'бақ'];
    expect(gridWordAt(rows, words, lineBetween({ row: 0, col: 0 }, { row: 0, col: 3 })!, new Set())).toBe('алма');
    expect(gridWordAt(rows, words, lineBetween({ row: 3, col: 2 }, { row: 3, col: 0 })!, new Set())).toBe('бақ');
    expect(gridWordAt(rows, words, lineBetween({ row: 1, col: 2 }, { row: 2, col: 2 })!, new Set(['су']))).toBeNull();
    expect(gridWordAt(rows, words, [{ row: 0, col: 0 }], new Set())).toBeNull();
  });
  it('locates words for painting', () => {
    expect(locateWord(rows, 'су')).toEqual([{ row: 1, col: 2 }, { row: 2, col: 2 }]);
    expect(locateWord(rows, 'бақ')?.[0]).toEqual({ row: 3, col: 0 });
    expect(locateWord(rows, 'жоқ')).toBeNull();
  });
});

describe('matching', () => {
  it('grades the first pick per word and tracks matched words', () => {
    let r = pickMatch(emptyMatch, 'орман', 'река', 'лес');
    expect(r.correct).toBe(false);
    r = pickMatch(r.state, 'орман', 'лес', 'лес');
    expect(r.correct).toBe(true);
    expect(r.state.matched).toEqual(['орман']);
    expect(matchPayload([{ word: 'орман', translation: 'лес' }, { word: 'су', translation: 'вода' }], r.state)).toEqual([
      { word: 'орман', translation: 'река' },
      { word: 'су', translation: '' },
    ]);
  });
});

describe('mcqPayload', () => {
  it('uses the first option as the answer and skips unanswered questions', () => {
    const qs = [{ options: [{ word: 'су' }, { word: 'өзен' }] }, { options: [{ word: 'алма' }] }];
    expect(mcqPayload(qs, ['өзен'])).toEqual([{ answer: 'су', studentAnswer: 'өзен' }]);
  });
});
