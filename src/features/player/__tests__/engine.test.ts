import { isStepComplete, letters, sameText, usedTiles, wordCount, wordsUsed } from '../engine/checking';
import { parseParagraph } from '../engine/passage';
import type { Step } from '../engine/types';

describe('parseParagraph', () => {
  it('splits plain text, words and their dictionary entries', () => {
    const text = 'Біз \\~табиғатты\\~табиғат+ты:2\\~ қорғаймыз. \\~Орман\\~=\\~ әдемі';
    expect(parseParagraph(text)).toEqual([
      { kind: 'text', text: 'Біз ' },
      { kind: 'word', text: 'табиғатты', lemma: 'табиғат' },
      { kind: 'text', text: ' қорғаймыз. ' },
      { kind: 'word', text: 'Орман', lemma: 'орман' },
      { kind: 'text', text: ' әдемі' },
    ]);
  });

  it('keeps unmarked text as one token', () => {
    expect(parseParagraph('Жай мәтін.')).toEqual([{ kind: 'text', text: 'Жай мәтін.' }]);
  });

  it('uses the word itself for "@" entries and missing metadata', () => {
    expect(parseParagraph('\\~Алма\\~@x')[0]).toEqual({ kind: 'word', text: 'Алма', lemma: 'алма' });
    expect(parseParagraph('\\~Су')[0]).toEqual({ kind: 'word', text: 'Су', lemma: 'су' });
  });
});

describe('text helpers', () => {
  it('counts words and used vocabulary', () => {
    expect(wordCount('  Бақта   алма өседі. ')).toBe(3);
    expect(wordCount('')).toBe(0);
    expect(wordsUsed(['бақ', 'алма', 'су'], 'Бақта АЛМА өседі')).toBe(2);
  });

  it('splits scrambled words into letter tiles', () => {
    expect(letters('ТА ҒИ')).toEqual(['Т', 'А', 'Ғ', 'И']);
  });

  it('marks one tile per typed letter', () => {
    expect(usedTiles(['А', 'Л', 'М', 'А'], 'ал')).toEqual([true, true, false, false]);
    expect(usedTiles(['А', 'Л', 'М', 'А'], 'ааа')).toEqual([true, false, false, true]);
  });

  it('compares typed answers without case or spaces', () => {
    expect(sameText(' Табиғат ', 'табиғат')).toBe(true);
    expect(sameText('орман', 'өзен')).toBe(false);
  });
});

describe('isStepComplete', () => {
  const choice: Step = {
    id: 'a:mcq',
    kind: 'choice',
    label: 'mcq',
    group: 'a',
    questions: [
      { question: 'q1', options: ['a', 'b'] },
      { question: 'q2', options: ['a', 'b'] },
    ],
  };

  it('needs every question answered', () => {
    expect(isStepComplete(choice, ['a'])).toBe(false);
    expect(isStepComplete(choice, ['a', ' '])).toBe(false);
    expect(isStepComplete(choice, ['a', 'b'])).toBe(true);
  });

  it('lets passages and cards through', () => {
    expect(isStepComplete({ id: 'p', kind: 'passage', label: 'reading', group: 'a', paragraphs: [] }, undefined)).toBe(true);
    expect(isStepComplete({ id: 'c', kind: 'cards', label: 'cards', group: 'a', cards: [] }, undefined)).toBe(true);
  });

  it('needs every word matched', () => {
    const match: Step = { id: 'm', kind: 'match', label: 'match', group: 'a', pairs: [{ word: 'су' }, { word: 'бақ' }], translations: ['вода', 'сад'] };
    expect(isStepComplete(match, { су: 'вода' })).toBe(false);
    expect(isStepComplete(match, { су: 'вода', бақ: 'сад' })).toBe(true);
  });

  it('respects the minimum word count of writing tasks', () => {
    const writing: Step = { id: 'w', kind: 'text', label: 'writing', group: 'z', prompts: [{ question: '' }], minWords: 3 };
    expect(isStepComplete(writing, ['екі сөз'])).toBe(false);
    expect(isStepComplete(writing, ['үш сөз бар'])).toBe(true);
    const frq: Step = { id: 'f', kind: 'text', label: 'frq', group: 'a', prompts: [{ question: 'q' }] };
    expect(isStepComplete(frq, [''])).toBe(false);
    expect(isStepComplete(frq, ['жауап'])).toBe(true);
  });
});
