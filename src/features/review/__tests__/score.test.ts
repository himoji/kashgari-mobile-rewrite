import { parseScore } from '@/features/review/score';

describe('parseScore', () => {
  it('accepts whole points from 0 to 10', () => {
    expect(parseScore('0')).toBe(0);
    expect(parseScore(' 7 ')).toBe(7);
    expect(parseScore('10')).toBe(10);
  });
  it('rejects empty, fractional and out-of-range input', () => {
    expect(parseScore('')).toBeNull();
    expect(parseScore('7.5')).toBeNull();
    expect(parseScore('11')).toBeNull();
    expect(parseScore('-1')).toBeNull();
  });
});
