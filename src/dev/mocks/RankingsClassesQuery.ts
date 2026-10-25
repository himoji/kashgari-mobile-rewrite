const cls = (id: string, grade: number, letter: string, scores: number[]) => ({
  __typename: 'Class',
  id,
  grade,
  letter,
  students: scores.map((acorns, i) => ({ __typename: 'Student', id: `${id}-${i}`, acorns })),
});

export default () => ({
  student: {
    __typename: 'Student',
    id: 'p1',
    class: {
      __typename: 'Class',
      id: 'c7a',
      teacher: {
        __typename: 'Teacher',
        id: 't1',
        school: {
          __typename: 'School',
          id: 'sch',
          teachers: [
            {
              __typename: 'Teacher',
              id: 't1',
              classes: [cls('c7a', 7, 'А', [30, 20, 10]), cls('c7b', 7, 'Б', [50, 40])],
            },
            {
              __typename: 'Teacher',
              id: 't2',
              classes: [
                cls('c6a', 6, 'А', [40, 37]),
                cls('c8a', 8, 'А', [64]),
                cls('c7a', 7, 'А', [30, 20, 10]),
              ],
            },
            {
              __typename: 'Teacher',
              id: 't3',
              classes: [
                cls('c5a', 5, 'А', [51]),
                cls('c5b', 5, 'Б', [45]),
                cls('c10a', 10, 'А', [30]),
              ],
            },
          ],
        },
      },
    },
  },
});
