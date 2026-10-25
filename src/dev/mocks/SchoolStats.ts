// The prototype's school numbers: 12 students, 2 teachers, 70% average.
export default () => ({
  statsPoints: [{ __typename: 'StatsPointsResult', points: 70, maxPoints: 100 }],
  statsMembers: [{ __typename: 'StatsMembersResult', students: 12, teachers: 2 }],
});
