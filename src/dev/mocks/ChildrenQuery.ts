// A parent with two children from the prototype's sample school: Аружан (7А) and Мирас (5Б).
const cls = (id: string, grade: number, letter: string) => ({
  __typename: 'Class',
  id,
  grade,
  letter,
  teacher: { __typename: 'Teacher', id: 't1', name: 'Айгүл Қасымова', school: { __typename: 'School', id: 'school1', name: '№ 125 мектеп-лицей' } },
});

export default () => ({
  parent: {
    __typename: 'Parent',
    id: 'p1',
    name: 'Ерлан Сәрсен',
    children: [
      {
        __typename: 'Account',
        id: 'acc-aruzhan',
        streak: 5,
        languageLevel: 'A2',
        studentProfiles: [{ __typename: 'Student', id: 's0', name: 'Аружан Сейіт', class: cls('c1', 7, 'А') }],
      },
      {
        __typename: 'Account',
        id: 'acc-miras',
        streak: 2,
        languageLevel: 'A1',
        studentProfiles: [{ __typename: 'Student', id: 's5b2', name: 'Мирас Орал', class: cls('c2', 5, 'Б') }],
      },
    ],
  },
});
