import { reviewStudent } from './_review-fixtures';

export default (v: { id: string }) => ({
  miniStorySubmission: {
    __typename: 'OynaSubmissionMiniStory',
    id: v.id,
    createdAt: Math.floor(new Date(2026, 9, 8).getTime() / 1000),
    text: 'Менің сүйікті мезгілім — күз. Күзде ағаштардың жапырақтары сарғаяды, ал ауа салқын болады.',
    points: v.id.endsWith('1') ? 7 : null,
    student: reviewStudent(v.id),
    game: { __typename: 'OynaGameMiniStory', id: 'm1', name: 'Менің сүйікті мезгілім', words: ['күз', 'жапырақ', 'салқын'], maxPoints: 10 },
  },
});
