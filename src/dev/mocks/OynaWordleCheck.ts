export default (v: { word: string }) => ({ wordleCheckWord: !/^(.)\1+$/u.test(v.word) });
