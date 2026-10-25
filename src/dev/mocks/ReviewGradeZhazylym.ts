export default (v: { id: string; points: number }) => ({ zhazylymGrade: { __typename: 'ZhazylymSubmission', id: v.id, points: v.points } });
