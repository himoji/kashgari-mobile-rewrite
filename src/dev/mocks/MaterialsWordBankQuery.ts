const level = (lvl: string, words: string[]) => ({ __typename: 'TopicLevel', level: lvl, words: words.map((word) => ({ __typename: 'WordObject', word })) });

export default () => ({
  topics: [
    { __typename: 'Topic', name: 'Табиғат', levels: [level('A1', ['табиғат', 'орман', 'өзен']), level('A2', ['бақ', 'алма', 'су', 'қорғау'])] },
    { __typename: 'Topic', name: 'Қала', levels: [level('A1', ['қала', 'көше', 'саябақ']), level('B1', ['саяхат', 'кітапхана'])] },
  ],
});
