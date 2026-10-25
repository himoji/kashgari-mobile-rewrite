const words: Record<string, { ru: string; en: string; kk: string; example: string }> = {
  табиғат: {
    kk: 'Адамды қоршаған әлем: жер, су, ауа, өсімдіктер мен жануарлар.',
    ru: 'природа',
    en: 'nature',
    example: 'Біз табиғатты қорғауымыз керек.',
  },
  өзен: {
    kk: 'Арнасымен ағатын табиғи су ағыны.',
    ru: 'река',
    en: 'river',
    example: 'Ауылдың жанында өзен бар.',
  },
  су: {
    kk: 'Тіршілік үшін қажет мөлдір сұйықтық.',
    ru: 'вода',
    en: 'water',
    example: 'Өсімдіктерге су қажет.',
  },
};

export default ({ word }: { word?: string }) => {
  const w = words[word ?? ''];
  if (!w) return { word: null };
  return {
    word: {
      __typename: 'Word',
      id: '101',
      url: word,
      definitions: [
        {
          __typename: 'Definition',
          id: 'd1',
          order: 1,
          text: w.kk,
          textRussian: w.ru,
          translationRussian: w.ru,
          translationEnglish: w.en,
          examples: [{ __typename: 'Example', id: 'e1', order: 1, text: w.example }],
        },
      ],
    },
  };
};
