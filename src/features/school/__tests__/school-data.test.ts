import fixture from '@/dev/mocks/SchoolPrincipal';
import type { SchoolPrincipalQuery } from '@/graphql/graphql';
import { averageScore, classRows, isActiveTeacher, mapSchool, teacherActivity, teacherRows } from '@/features/school/school-data';

const api = (fixture() as unknown as SchoolPrincipalQuery).principal!.school;
const at = (m: number, d: number) => Math.floor(new Date(2026, m, d, 12).getTime() / 1000);
const now = at(9, 22);
const school = mapSchool(api, now);

describe('mapSchool', () => {
  it('maps teachers and a flat class list with each class teacher', () => {
    expect(school.teachers.map((t) => t.name)).toEqual(['Айгүл Қасымова', 'Марат Әбіл']);
    expect(school.classes.map((c) => [c.name, c.teacherName])).toEqual([
      ['7А', 'Айгүл Қасымова'],
      ['5Б', 'Айгүл Қасымова'],
      ['10А', 'Марат Әбіл'],
    ]);
  });

  it('lists a class shared by two teachers once', () => {
    const shared = { ...api, teachers: [api.teachers[0]!, { ...api.teachers[0]!, id: 't3', name: 'Екінші' }] };
    expect(mapSchool(shared, now).classes).toHaveLength(2);
  });
});

describe('school rows', () => {
  it('counts students and published work per class (drafts excluded)', () => {
    expect(classRows(school)).toEqual([
      { id: 'c1', name: '7А', teacherName: 'Айгүл Қасымова', studentCount: 8, workCount: 10 },
      { id: 'c2', name: '5Б', teacherName: 'Айгүл Қасымова', studentCount: 4, workCount: 1 },
      { id: 'c10a', name: '10А', teacherName: 'Марат Әбіл', studentCount: 0, workCount: 0 },
    ]);
  });

  it('summarises teachers: classes, activity and work given', () => {
    expect(teacherRows(school, now)).toEqual([
      { id: 't1', name: 'Айгүл Қасымова', classNames: ['7А', '5Б'], active: true, workCount: 11 },
      { id: 't2', name: 'Марат Әбіл', classNames: ['10А'], active: false, workCount: 0 },
    ]);
  });
});

describe('teacher activity', () => {
  it('counts work given since the period start', () => {
    expect(teacherActivity(school.teachers, null).map((a) => a.count)).toEqual([11, 0]);
    expect(teacherActivity(school.teachers, at(11, 1)).map((a) => a.count)).toEqual([0, 0]);
  });

  it('marks a teacher inactive after 30 quiet days', () => {
    expect(isActiveTeacher(school.teachers[0]!, now)).toBe(true);
    expect(isActiveTeacher(school.teachers[0]!, at(11, 31))).toBe(false);
  });

  it('averages scored attempts and is null without any', () => {
    expect(averageScore(school.teachers[0]!.classes)).toEqual(expect.any(Number));
    expect(averageScore(school.teachers[1]!.classes)).toBeNull();
  });
});
