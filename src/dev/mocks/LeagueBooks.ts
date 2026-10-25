import { leagueTexts, paragraphs } from './_leagueTexts';

export default () => ({
  oqylymTextsByComplexity: leagueTexts.map((b) => ({
    __typename: 'OqylymText',
    id: b.id,
    title: b.title,
    paragraphs: paragraphs(b.text),
  })),
});
