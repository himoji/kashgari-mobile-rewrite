const names = [
  'Әли Нұрлан',
  'Айша Мұрат',
  'Данияр Әсет',
  'Медина Омар',
  'Ерасыл Қанат',
  'Томирис Әлі',
  'Нұрислам Бек',
  'Айым Ермек',
  'Арман Сәкен',
  'Мирас Орал',
  'Асыл Мұхамед',
];

export default () => ({
  student: {
    __typename: 'Student',
    id: 'p1',
    class: {
      __typename: 'Class',
      id: 'c7a',
      students: [
        ...names.map((name, i) => ({
          __typename: 'Student',
          id: `s${i}`,
          name,
          acorns: 70 - i * 5,
        })),
        { __typename: 'Student', id: 'p1', name: 'Аружан Сейіт', acorns: 0 },
      ],
    },
  },
});
