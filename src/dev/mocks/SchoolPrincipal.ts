// The prototype's school: Айгүл Қасымова (7А, 5Б, the teacher sample data) and Марат Әбіл (10А, no work yet).
import teacherSchool from './TeacherSchool';

export default () => {
  const { teacher } = teacherSchool();
  return {
    principal: {
      __typename: 'Principal',
      id: 'p1',
      school: {
        __typename: 'School',
        id: 'school1',
        name: '№ 125 мектеп-лицей',
        teachers: [
          { __typename: 'Teacher', id: 't1', name: 'Айгүл Қасымова', classes: teacher.classes },
          {
            __typename: 'Teacher',
            id: 't2',
            name: 'Марат Әбіл',
            classes: [
              {
                __typename: 'Class',
                id: 'c10a',
                grade: 10,
                letter: 'А',
                students: [],
                assignments: [],
                zhazylymAssignments: [],
                oynaGames: [],
                durysAssignments: [],
                lessons: [],
              },
            ],
          },
        ],
      },
    },
  };
};
