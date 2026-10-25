export default (v: { id: string }) => ({
  miniStoryGame: {
    __typename: 'OynaGameMiniStory',
    id: v.id,
    name: 'Бақтағы бір күн',
    duration: 600,
    words: ['бақ', 'алма', 'су'],
    submission: v.id.startsWith('done') ? { __typename: 'OynaSubmissionMiniStory', id: 'm1' } : null,
  },
});
