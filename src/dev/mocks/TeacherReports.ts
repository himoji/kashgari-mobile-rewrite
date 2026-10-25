// Numbers shaped like the prototype's report (70% average, 7А 75% / 5Б 60%, five activity bars, 12 students and 2 teachers).
const classPct = [75, 60];
const clicks = [110, 145, 130, 180, 162];

export default (v: { classPoints: unknown[]; clicks: unknown[] }) => ({
  statsPoints: [{ __typename: 'StatsPointsResult', points: 70, maxPoints: 100 }],
  classPoints: v.classPoints.map((_, i) => ({ __typename: 'StatsPointsResult', points: classPct[i % 2]!, maxPoints: 100 })),
  statsClicks: v.clicks.map((_, i) => ({ __typename: 'StatsClicksResult', clicks: clicks[i % 5]! })),
  statsMembers: [{ __typename: 'StatsMembersResult', students: 12, teachers: 2 }],
});
