export default () => ({
  teacher: {
    __typename: 'Teacher',
    id: 't1',
    classes: [
      { __typename: 'Class', id: 'c7a', grade: 7 },
      { __typename: 'Class', id: 'c5b', grade: 5 },
    ],
  },
  allGrades: [5, 7, 8, 10, 21, 30].map((grade) => ({ __typename: 'Grade', grade, name: null })),
});
