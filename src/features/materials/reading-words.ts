/** Splits reading text into tokens; word tokens carry the lookup form for the dictionary. */
export type Token = { text: string; word: string | null };

const LETTERS = /[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/u;

export function tokenize(text: string): Token[] {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => {
      const m = LETTERS.exec(part);
      return { text: part, word: m ? m[0].toLocaleLowerCase() : null };
    });
}

export const countWords = (paragraphs: string[]) => paragraphs.reduce((n, p) => n + tokenize(p).filter((t) => t.word).length, 0);
