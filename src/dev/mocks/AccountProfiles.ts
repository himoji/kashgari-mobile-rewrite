export default () => ({
  account: {
    __typename: 'Account',
    id: 'a1',
    email: '+77000000003',
    languageContext: 'KZ',
    studentProfiles: [
      { __typename: 'Student', id: 's0', name: 'Аружан Сейіт', class: { __typename: 'Class', id: 'c7a', grade: 7, letter: 'А', teacher: { __typename: 'Teacher', id: 't1', school: { __typename: 'School', id: 'sc1', name: '№ 125 мектеп-лицей' } } } },
    ],
    teacherProfiles: [{ __typename: 'Teacher', id: 't1', name: 'Айгүл Қасымова', school: { __typename: 'School', id: 'sc1', name: '№ 125 мектеп-лицей' } }],
    parentProfile: { __typename: 'Parent', id: 'pa1', name: 'Ерлан Сәрсен' },
    principalProfiles: [{ __typename: 'Principal', id: 'p1', name: 'Гүлнар Ахметова', school: { __typename: 'School', id: 'school1', name: '№ 125 мектеп-лицей' } }],
  },
});
