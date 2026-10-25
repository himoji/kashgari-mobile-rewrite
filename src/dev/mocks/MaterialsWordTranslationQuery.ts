const dict: Record<string, [string, string]> = {
  табиғат: ['природа', 'nature'],
  орман: ['лес', 'forest'],
  өзен: ['река', 'river'],
  бақ: ['сад', 'garden'],
  алма: ['яблоко', 'apple'],
  су: ['вода', 'water'],
  қорғау: ['защищать', 'protect'],
  қала: ['город', 'city'],
  көше: ['улица', 'street'],
  саябақ: ['парк', 'park'],
  саяхат: ['путешествие', 'trip'],
  кітапхана: ['библиотека', 'library'],
};

export default ({ word }: { word: string }) => {
  const t = dict[word];
  return {
    word: t
      ? { __typename: 'Word', id: `w-${word}`, definitions: [{ __typename: 'Definition', id: `d-${word}`, translationRussian: t[0], translationEnglish: t[1] }] }
      : null,
  };
};
