/** "+7 700 000 00 00" while typing; the API wants "+77000000000". Accepts pasted 8/+7 numbers too. */
export function formatPhone(input: string) {
  const raw = input.startsWith('+7') ? input.slice(2) : input;
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && /^[78]/.test(d)) d = d.slice(1);
  d = d.slice(0, 10);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
  return d ? `+7 ${parts.join(' ')}` : '';
}

/** The 6-digit sign-in code from what was typed or pasted ("123 456", "123-456"): digits first, then the length. */
export const codeDigits = (input: string) => input.replace(/\D/g, '').slice(0, 6);

export const phoneDigits = (formatted: string) => `+${formatted.replace(/\D/g, '')}`;
export const isValidPhone = (formatted: string) => /^\+7\d{10}$/.test(phoneDigits(formatted));
