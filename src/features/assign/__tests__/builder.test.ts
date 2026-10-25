import {
  blocksFromSource,
  blockTitle,
  contentError,
  deadlineSeconds,
  formatDay,
  gamesInput,
  hasGame,
  upcomingDays,
  type Block,
  type Games,
} from '@/features/assign/builder';

const games = {
  __typename: 'Games',
  multipleChoice: { __typename: 'GameMultipleChoice', questions: [{ __typename: 'GameMultipleChoiceQuestion', question: 'Оқушылар сенбі күні не істеді?', options: ['A. Өзенді тазалады', 'B. Ойнады'] }] },
  trueFalse: { __typename: 'GameTrueFalse', questions: [{ __typename: 'GameTrueFalseQuestion', question: 'Табиғатты қорғау — әр адамның міндеті.', answer: null }] },
  freeResponse: { __typename: 'GameFreeResponse', questions: [] },
  completeV2: { __typename: 'GameCompleteV2', sentences: [{ __typename: 'GameCompleteV2Sentence', before: 'Ол бізге таза', after: 'береді.', wordGroup: ['ауа'] }] },
  wordMatch: null,
  wordShuffle: { __typename: 'GameWordShuffle', pairs: [{ __typename: 'GameWordShufflePair', word: 'су', shuffled: 'ус' }, { __typename: 'GameWordShufflePair', word: null, shuffled: 'x' }] },
  wordGrid: null,
  crossword: null,
} as unknown as Games;

const label = (t: string) => `label:${t}`;

describe('assignment builder', () => {
  it('builds the design blocks from a reading material, skipping empty games', () => {
    const blocks = blocksFromSource({ ref: { kind: 'oqylym', id: '1' }, title: 'Табиғат' }, games, label);
    expect(blocks.map((b) => b.type)).toEqual(['reading', 'cards', 'mcq', 'tf']);
    expect(blocks[2]?.title).toBe('Оқушылар сенбі күні не істеді?');
  });

  it('turns a grammar material into one block and a listening text into a listening block', () => {
    expect(blocksFromSource({ ref: { kind: 'grammar', id: 'g' }, title: 'Септік' }, null, label).map((b) => b.type)).toEqual(['grammar']);
    expect(blocksFromSource({ ref: { kind: 'tyndalym', id: '2' }, title: 'Алматы' }, null, label).map((b) => b.type)).toEqual(['listening', 'cards']);
  });

  it('knows which games have content', () => {
    expect(hasGame('frq', games)).toBe(false);
    expect(hasGame('complete', games)).toBe(true);
    expect(hasGame('cards', null)).toBe(true);
    expect(hasGame('mcq', null)).toBe(false);
    expect(blockTitle('complete', games, 'x')).toBe('Ол бізге таза … береді.');
    expect(blockTitle('match', games, 'Сәйкестендіру')).toBe('Сәйкестендіру');
  });

  it('sends only the chosen games and strips option letters', () => {
    const blocks = [{ type: 'mcq' }, { type: 'tf' }, { type: 'shuffle' }].map((b, i) => ({ ...b, key: String(i), title: '' })) as Block[];
    expect(gamesInput(blocks, games)).toEqual({
      multipleChoice: { questions: [{ question: 'Оқушылар сенбі күні не істеді?', options: ['Өзенді тазалады', 'Ойнады'] }] },
      trueFalse: { questions: [{ question: 'Табиғатты қорғау — әр адамның міндеті.', answer: false }] },
      wordShuffle: { pairs: [{ word: 'су', shuffled: 'ус' }] },
    });
    expect(gamesInput(blocks, null)).toEqual({});
  });

  it('validates the content step', () => {
    const source = { ref: { kind: 'oqylym' as const, id: '1' }, title: 'T' };
    expect(contentError(' ', source, [])).toBe('name');
    expect(contentError('A', null, [])).toBe('content');
    expect(contentError('A', source, [{ key: 'k', type: 'reading', title: 'T' }])).toBeNull();
  });

  it('computes deadlines and the day list in local time', () => {
    const d = new Date(deadlineSeconds('2026-10-31') * 1000);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 31, 23, 59]);
    expect(upcomingDays(new Date(2026, 9, 30), 3)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('formatDay', () => {
  it('names the day without Intl', () => {
    const months = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    const days = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
    expect(formatDay('2026-10-31', months, days)).toBe('31 қазан, сенбі');
    expect(formatDay('2026-10-31', months, days, true)).toBe('қазан 31, сенбі');
  });
});
