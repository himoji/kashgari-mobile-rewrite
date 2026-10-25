import { baseForm, paginate, pageText, parseParagraph } from '@/features/reader/book';

describe('parseParagraph', () => {
  it('makes every plain word tappable with a cleaned lookup', () => {
    expect(parseParagraph('Біздің ауыл, өзен.')).toEqual([
      { text: 'Біздің', lookup: 'біздің' },
      { text: ' ' },
      { text: 'ауыл,', lookup: 'ауыл' },
      { text: ' ' },
      { text: 'өзен.', lookup: 'өзен' },
    ]);
  });

  it('reads withDef notes: base form and definition index', () => {
    const tokens = parseParagraph('Біз \\~табиғатты\\~табиғат+ты:2\\~ қорғаймыз');
    expect(tokens[2]).toEqual({ text: 'табиғатты', lookup: 'табиғат', def: 1 });
    expect(tokens.map((t) => t.text).join('')).toBe('Біз табиғатты қорғаймыз');
  });

  it('uses the surface word when the note starts with = or @', () => {
    expect(parseParagraph('\\~Су\\~=:1\\~')[0]).toEqual({ text: 'Су', lookup: 'су', def: 0 });
    expect(parseParagraph('\\~Су\\~@x\\~')[0]).toEqual({
      text: 'Су',
      lookup: 'су',
      def: undefined,
    });
  });
});

describe('baseForm', () => {
  it('strips markers and punctuation', () => {
    expect(baseForm('=Қала+лар:3')).toBe('қала');
    expect(baseForm('«Алматы»,')).toBe('алматы');
  });
});

describe('paginate', () => {
  it('starts a page for every paragraph and keeps images on the first page', () => {
    const pages = paginate([{ text: 'Бір. Екі.', image: 'a.webp' }, { text: 'Үш.' }]);
    expect(pages).toHaveLength(2);
    expect(pages[0]!.image).toBe('a.webp');
    expect(pageText(pages[1]!)).toBe('Үш.');
  });

  it('cuts long paragraphs at sentence ends', () => {
    const sentence = 'а б в г д е ж з и к.';
    const pages = paginate([{ text: Array(12).fill(sentence).join(' ') }], 80);
    expect(pages).toHaveLength(2);
    expect(pageText(pages[0]!).split(/\s+/)).toHaveLength(80);
    expect(pageText(pages[1]!).split(/\s+/)).toHaveLength(40);
  });

  it('never returns zero pages', () => {
    expect(paginate([])).toEqual([{ tokens: [] }]);
  });
});
