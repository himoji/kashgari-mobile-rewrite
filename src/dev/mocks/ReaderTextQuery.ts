import { leagueTexts, paragraphs } from './_leagueTexts';

// withDef markup: the first "табиғатты" points at its dictionary form.
export default ({ id }: { id?: string }) => {
  const b = leagueTexts.find((x) => x.id === id) ?? leagueTexts[0]!;
  const text = b.text.replace('табиғатты қорғау', '\\~табиғатты\\~табиғат+ты:1\\~ қорғау');
  return {
    oqylymText: {
      __typename: 'OqylymText',
      id: b.id,
      title: b.title,
      paragraphs: paragraphs(text),
    },
  };
};
