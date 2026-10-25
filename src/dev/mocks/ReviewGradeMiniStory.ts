export default (v: { id: string; points: number }) => ({ miniStoryGrade: { __typename: 'OynaSubmissionMiniStory', id: v.id, points: v.points } });
