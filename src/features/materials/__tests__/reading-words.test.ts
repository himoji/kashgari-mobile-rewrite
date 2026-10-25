import { countWords, tokenize } from '@/features/materials/reading-words';

describe('tokenize', () => {
  it('keeps spacing and punctuation while exposing the word to look up', () => {
    const tokens = tokenize('Табиғат — біздің үйіміз.');
    expect(tokens.map((t) => t.text).join('')).toBe('Табиғат — біздің үйіміз.');
    expect(tokens.filter((t) => t.word).map((t) => t.word)).toEqual(['табиғат', 'біздің', 'үйіміз']);
  });

  it('counts words across paragraphs', () => {
    expect(countWords(['Бір екі.', 'Үш — төрт-бес'])).toBe(4);
  });
});
