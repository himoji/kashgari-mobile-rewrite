import { sampleTexts } from './_materials-sample';

const meta: Record<string, { section: string; grade: number; complexity: number; words: string[] }> = {
  nature: { section: 'Табиғат және адам', grade: 7, complexity: 3, words: ['табиғат', 'орман', 'өзен', 'су', 'қорғау'] },
  city: { section: 'Қала және саяхат', grade: 7, complexity: 3, words: ['саяхат', 'дос', 'кітап', 'табиғат'] },
  garden: { section: 'Отбасы және күнделікті өмір', grade: 5, complexity: 2, words: ['бақ', 'алма', 'су'] },
  heritage: { section: 'Мәдениет және дәстүр', grade: 8, complexity: 3, words: ['дос', 'табиғат', 'бақ'] },
  future: { section: 'Қоғам және болашақ', grade: 10, complexity: 4, words: ['табиғат', 'қорғау', 'су'] },
};
const grammar: Record<string, string> = { plural: 'Көптік жалғауы', possessive: 'Тәуелдік жалғауы', case: 'Жатыс септігі' };

function text(typename: 'OqylymText' | 'TyndalymText', id: string) {
  const sample = sampleTexts[id as keyof typeof sampleTexts] ?? sampleTexts.nature;
  const m = meta[id] ?? meta.nature!;
  return {
    __typename: typename,
    id,
    title: sample.title,
    complexity: m.complexity,
    baseWords: m.words,
    thumbnail: null,
    ...(typename === 'TyndalymText' ? { audioUrl: null } : {}),
    paragraphs: sample.paragraphs.map((p) => ({ __typename: typename === 'OqylymText' ? 'OqylymParagraph' : 'TyndalymParagraph', text: p })),
    section: { __typename: 'Section', section: 1, name: { __typename: 'Name', kazakh: m.section, russian: null, english: null }, grade: { __typename: 'Grade', grade: m.grade } },
  };
}

export default ({ id, oqylym, tyndalym, grammar: isGrammar }: { id: string; oqylym: boolean; tyndalym: boolean; grammar: boolean }) => ({
  ...(oqylym ? { oqylymText: text('OqylymText', id) } : {}),
  ...(tyndalym ? { tyndalymText: text('TyndalymText', id) } : {}),
  ...(isGrammar ? { durysTitle: { __typename: 'DurysTitle', id, title: grammar[id] ?? 'Грамматика' } } : {}),
});
