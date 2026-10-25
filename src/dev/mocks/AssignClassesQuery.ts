export default () => ({
  teacher: {
    __typename: 'Teacher',
    id: 't1',
    classes: [
      { __typename: 'Class', id: 'c7a', grade: 7, letter: 'А' },
      { __typename: 'Class', id: 'c5b', grade: 5, letter: 'Б' },
    ],
  },
});
