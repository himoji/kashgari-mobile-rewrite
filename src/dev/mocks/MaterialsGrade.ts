const name = (kazakh: string, russian: string, english: string) => ({ __typename: 'Name', kazakh, russian, english });
const text = (kind: 'OqylymText' | 'TyndalymText', id: string, title: string, complexity: number) => ({ __typename: kind, id, title, complexity, thumbnail: null });

const byGrade: Record<number, { name: ReturnType<typeof name>; oqylym: ReturnType<typeof text>[]; tyndalym: ReturnType<typeof text>[] }[]> = {
  7: [
    { name: name('Табиғат және адам', 'Природа и человек', 'Nature and people'), oqylym: [text('OqylymText', 'nature', 'Табиғат — біздің ортақ үйіміз', 3)], tyndalym: [] },
    { name: name('Қала және саяхат', 'Город и путешествия', 'City and travel'), oqylym: [], tyndalym: [text('TyndalymText', 'city', 'Алматыдағы бір күн', 3)] },
  ],
  5: [{ name: name('Отбасы және күнделікті өмір', 'Семья и быт', 'Family and daily life'), oqylym: [text('OqylymText', 'garden', 'Атамның бағы', 2)], tyndalym: [] }],
  8: [{ name: name('Мәдениет және дәстүр', 'Культура и традиции', 'Culture and tradition'), oqylym: [text('OqylymText', 'heritage', 'Наурыз — жаңару мерекесі', 3)], tyndalym: [] }],
  10: [{ name: name('Қоғам және болашақ', 'Общество и будущее', 'Society and the future'), oqylym: [], tyndalym: [text('TyndalymText', 'future', 'Болашақ қаласы', 4)] }],
};

export default ({ grade }: { grade?: number }) => ({
  grade: {
    __typename: 'Grade',
    grade,
    sections: (byGrade[grade ?? 0] ?? []).map((s, i) => ({
      __typename: 'Section',
      section: i + 1,
      name: s.name,
      oqylymTexts: s.oqylym,
      tyndalymTexts: s.tyndalym,
    })),
  },
});
