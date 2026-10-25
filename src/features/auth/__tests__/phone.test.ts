import { formatPhone, isValidPhone, phoneDigits } from '@/features/auth/phone';

describe('formatPhone', () => {
  it.each([
    ['7001234567', '+7 700 123 45 67'],
    ['87001234567', '+7 700 123 45 67'],
    ['+7 7001234567', '+7 700 123 45 67'],
    ['+77001234567', '+7 700 123 45 67'],
    ['+7 700 12', '+7 700 12'],
    ['', ''],
  ])('%s → %s', (input, out) => expect(formatPhone(input)).toBe(out));

  it('keeps formatting stable when re-applied', () => {
    expect(formatPhone(formatPhone('7001234567'))).toBe('+7 700 123 45 67');
  });

  it('produces API digits and validates', () => {
    expect(phoneDigits('+7 700 123 45 67')).toBe('+77001234567');
    expect(isValidPhone('+7 700 123 45 67')).toBe(true);
    expect(isValidPhone('+7 700 123')).toBe(false);
  });
});
