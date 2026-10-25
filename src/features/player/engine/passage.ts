import type { PassageParagraph, PassageToken } from './types';

/** Dictionary key for a marked word: lower case, without the "=" prefix and the "+ending" / ":index" suffixes. */
function lemmaOf(raw: string): string {
  let word = raw.toLowerCase();
  if (word.startsWith('=')) word = word.slice(1);
  return word.split('+')[0]!.split(':')[0]!;
}

/**
 * Paragraph text from `paragraphs(withDef: true)` is `plain \~ word \~ meta \~ plain …`.
 * The meta names the dictionary entry; "=" or "@" means the word itself is the entry.
 */
export function parseParagraph(text: string): PassageToken[] {
  const parts = text.split('\\~');
  const tokens: PassageToken[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const plain = parts[i] ?? '';
    if (plain) tokens.push({ kind: 'text', text: plain });
    const word = parts[i + 1];
    if (word === undefined) break;
    const meta = parts[i + 2] ?? '';
    const lemma = !meta || meta.startsWith('=') || meta.startsWith('@') ? lemmaOf(word) : lemmaOf(meta);
    tokens.push({ kind: 'word', text: word, lemma });
  }
  return tokens;
}

export function parseParagraphs(paragraphs: { text: string; image?: string | null }[]): PassageParagraph[] {
  return paragraphs.map((p) => ({ tokens: parseParagraph(p.text), image: p.image }));
}

/** Plain paragraphs (grammar explanations, story text): every word stays tappable by its own form. */
export function plainParagraph(text: string): PassageParagraph {
  return { tokens: text ? [{ kind: 'text', text }] : [] };
}
