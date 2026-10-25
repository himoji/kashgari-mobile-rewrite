const correct = new Set(['орман', 'өзен', 'су', 'тау', 'гүл']);
let spare: string[] = [];
let left = 0;

export default (v: { word: string }) => {
  if (left === 0) {
    left = 5;
    spare = ['тау', 'дәптер', 'гүл', 'қарындаш'];
  }
  const ok = correct.has(v.word);
  if (ok) left -= 1;
  const next = left > 0 ? spare.shift() : undefined;
  return {
    wordGameCaptchaCloudSubmit: {
      __typename: 'WordGameCaptchaCloudResult',
      correct: ok,
      left,
      newCloud: next ? { __typename: 'WordGameCaptchaCloud', word: next } : null,
    },
  };
};
