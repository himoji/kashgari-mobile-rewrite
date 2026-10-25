const tokens = (text: string) =>
  text
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter(Boolean);

export const countWords = (text: string) => tokens(text).length;

/**
 * Words from the list that appear in the story. Kazakh is agglutinative, so a token counts when it
 * starts with the word ("бақтағы" uses "бақ").
 */
export function usedWords(words: readonly string[], text: string): string[] {
  const list = tokens(text);
  return words.filter((w) => {
    const needle = w.toLocaleLowerCase().trim();
    return needle !== '' && list.some((t) => t.startsWith(needle));
  });
}
