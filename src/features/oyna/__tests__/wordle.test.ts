import { evaluateGuess, isWordDone, keyStates, keyboardRows, wordleGuessesPayload } from '@/features/oyna/logic/wordle';

describe('evaluateGuess', () => {
  it('marks exact, present and absent letters', () => {
    expect(evaluateGuess('АЛМАС', 'АЛАША')).toEqual(['correct', 'correct', 'absent', 'present', 'absent']);
  });
  it('does not over-count repeated letters', () => {
    // target has one О; the second О in the guess is absent
    expect(evaluateGuess('ОРОН', 'ОРАН')).toEqual(['correct', 'correct', 'absent', 'correct']);
    expect(evaluateGuess('ААББ', 'БАББ')).toEqual(['absent', 'correct', 'correct', 'correct']);
  });
  it('is case-insensitive for Kazakh letters', () => {
    expect(evaluateGuess('өзен', 'ӨЗЕН')).toEqual(['correct', 'correct', 'correct', 'correct']);
  });
});

describe('keyStates', () => {
  it('keeps the best state per key', () => {
    const keys = keyStates(['НОРМА', 'ОРМАН'], 'ОРМАН');
    expect(keys['О']).toBe('correct');
    expect(keys['Н']).toBe('correct');
  });
});

describe('isWordDone', () => {
  it('is done when solved or out of guesses', () => {
    expect(isWordDone(['орман'], 'ОРМАН')).toBe(true);
    expect(isWordDone(['АААAA', 'BBBBB'], 'ОРМАН')).toBe(false);
    expect(isWordDone(Array(6).fill('ААААА'), 'ОРМАН')).toBe(true);
  });
});

describe('wordleGuessesPayload', () => {
  it('uppercases, drops partial guesses and anything after the correct guess', () => {
    expect(wordleGuessesPayload(['орман', 'су'], [['алма', 'алмас', 'орман', 'өзенн'], []])).toEqual([['АЛМАС', 'ОРМАН'], []]);
  });
  it('returns one list per word even when the student never reached it', () => {
    expect(wordleGuessesPayload(['орман', 'өзен'], [['НОРМА']])).toEqual([['НОРМА'], []]);
  });
});

describe('keyboardRows', () => {
  it('includes the Kazakh letters for kk content', () => {
    expect(keyboardRows('kk').flat()).toEqual(expect.arrayContaining(['Ә', 'Ғ', 'Қ', 'Ң', 'Ө', 'Ұ', 'Ү', 'Һ', 'І']));
    expect(keyboardRows('en')[0]).toContain('Q');
  });
});
