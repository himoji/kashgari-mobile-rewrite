import { formatClock, oynaKind } from '@/features/oyna/logic/game-type';
import { countWords, usedWords } from '@/features/oyna/logic/ministory';
import { cleanBoards, guessedPayload, quizletSeconds } from '@/features/oyna/logic/quizlet';
import { displayTranslation } from '@/features/oyna/logic/translation';

describe('oynaKind', () => {
  it('accepts short kinds and API typenames', () => {
    expect(oynaKind('wordle')).toBe('wordle');
    expect(oynaKind('OynaGameWordGame')).toBe('wordgame');
    expect(oynaKind('OynaGameMiniStory')).toBe('ministory');
    expect(oynaKind('word-game')).toBe('wordgame');
    expect(oynaKind('battleships')).toBeNull();
    expect(oynaKind(undefined)).toBeNull();
  });
  it('formats clocks', () => {
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('displayTranslation', () => {
  it('picks the part for the explanation language', () => {
    expect(displayTranslation('лес; роща | forest', 'ru')).toBe('лес');
    expect(displayTranslation('лес | forest', 'en')).toBe('forest');
    expect(displayTranslation('лес', 'en')).toBe('лес');
    expect(displayTranslation('лес | forest', 'kk')).toBe('лес');
    expect(displayTranslation(null, 'ru')).toBe('');
  });
});

describe('mini story', () => {
  it('counts words and finds used ones with suffixes', () => {
    expect(countWords('  Бақта алма   өсті. ')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(usedWords(['бақ', 'алма', 'су'], 'Бақтағы алмалар!')).toEqual(['бақ', 'алма']);
  });
});

describe('quizlet', () => {
  it('cleans boards and builds the guessed payload', () => {
    expect(cleanBoards([[{ word: 'су' }, null, { word: 'су' }, { word: 'өзен' }]])).toEqual([[{ word: 'су' }, { word: 'өзен' }]]);
    expect(guessedPayload(3, [['су', 'су'], ['өзен']])).toEqual([['су'], ['өзен'], []]);
    expect(quizletSeconds(5)).toBe(20);
    expect(quizletSeconds(900)).toBe(480);
  });
});

import { rankRows } from '@/features/oyna/logic/leaderboard';

describe('rankRows', () => {
  it('sorts by points then time and shares places on ties', () => {
    const ranked = rankRows([
      { id: 'a', name: 'A', points: 5, time: 90 },
      { id: 'b', name: 'B', points: 7, time: 120 },
      { id: 'c', name: 'C', points: 5, time: 90 },
      { id: 'd', name: 'D', points: 5, time: 60 },
    ]);
    expect(ranked.map((r) => [r.id, r.place])).toEqual([
      ['b', 1],
      ['d', 2],
      ['a', 3],
      ['c', 3],
    ]);
  });
});
