/** A piece of reading text. Words carry `lookup`, the form to search in the dictionary. */
export type Token = { text: string; lookup?: string; def?: number };
export type BookPage = { tokens: Token[]; image?: string | null };

// `paragraphs(withDef: true)` returns "plain\~surface\~note\~plain..." triplets.
const SEP = '\\~';
const LETTER = /\p{L}/u;

/** Dictionary form from a surface word or a `withDef` note ("=", "base+suffix:2" ...). */
export function baseForm(raw: string): string {
  let w = raw.toLowerCase().normalize('NFC');
  if (w.startsWith('=')) w = w.slice(1);
  w = w.split('+')[0]!.split(':')[0]!;
  return w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
}

function plainTokens(text: string): Token[] {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((piece) =>
      LETTER.test(piece) ? { text: piece, lookup: baseForm(piece) } : { text: piece },
    );
}

export function parseParagraph(raw: string): Token[] {
  const parts = raw.split(SEP);
  const tokens: Token[] = [];
  parts.forEach((part, i) => {
    if (i % 3 === 0) tokens.push(...plainTokens(part));
    else if (i % 3 === 1) {
      const note = parts[i + 1] ?? '';
      const fromSurface = !note || note.startsWith('=') || note.startsWith('@');
      const def = Number.parseInt(note.split(':')[1] ?? '', 10);
      tokens.push({
        text: part,
        lookup: baseForm(fromSurface ? part : note),
        def: def > 0 ? def - 1 : undefined,
      });
    }
  });
  return tokens;
}

const isWord = (t: Token) => t.lookup !== undefined;
const endsSentence = (t: Token) => isWord(t) && /[.!?…]["»”')]?$/u.test(t.text);

/**
 * The design's book pages: every paragraph starts a page, and a long paragraph is cut
 * at sentence ends so a page holds about `maxWords` words.
 */
export function paginate(
  paragraphs: { text: string; image?: string | null }[],
  maxWords = 80,
): BookPage[] {
  const pages: BookPage[] = [];
  for (const paragraph of paragraphs) {
    const tokens = parseParagraph(paragraph.text);
    let image = paragraph.image ?? null;
    let page: Token[] = [];
    let sentence: Token[] = [];
    let words = 0;
    const flush = () => {
      while (page.length && !page[0]!.text.trim()) page.shift();
      if (page.length) {
        pages.push({ tokens: page, image });
        image = null;
      }
      page = [];
      words = 0;
    };
    for (const token of tokens) {
      sentence.push(token);
      if (!endsSentence(token)) continue;
      const count = sentence.filter(isWord).length;
      if (words && words + count > maxWords) flush();
      page.push(...sentence);
      words += count;
      sentence = [];
    }
    if (sentence.length) {
      const count = sentence.filter(isWord).length;
      if (words && words + count > maxWords) flush();
      page.push(...sentence);
    }
    flush();
    if (image) pages.push({ tokens: [], image });
  }
  return pages.length ? pages : [{ tokens: [] }];
}

export const pageText = (page: BookPage) =>
  page.tokens
    .map((t) => t.text)
    .join('')
    .trim();
