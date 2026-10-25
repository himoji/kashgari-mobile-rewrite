export default (v: { id: string }) => ({
  miniStoryGame: {
    __typename: 'OynaGameMiniStory',
    id: v.id,
    name: 'Бақтағы бір күн',
    words: ['бақ', 'алма', 'су'],
    maxPoints: 10,
    submission: {
      __typename: 'OynaSubmissionMiniStory',
      id: 'm1',
      time: 300,
      points: null,
      text: 'Жексенбі күні біз атамның бағына бардық. Бақтағы алмалар қызарып піскен екен. Біз ағаштарға су құйып, алма тердік.',
    },
  },
});
