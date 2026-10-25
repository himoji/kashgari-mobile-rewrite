import { mapClassWork, type ClassWork, type Work } from '@/features/classes/class-data';
import type { SchoolPrincipalQueryQuery } from '@/graphql/graphql';

type ApiSchool = NonNullable<SchoolPrincipalQueryQuery['principal']>['school'];

export interface SchoolTeacher {
  id: string;
  name: string;
  classes: ClassWork[];
}

export interface SchoolClass extends ClassWork {
  teacherId: string;
  teacherName: string;
}

export interface SchoolData {
  id: string;
  name: string;
  teachers: SchoolTeacher[];
  /** Every class of the school with its teacher, in teacher order. */
  classes: SchoolClass[];
}

const DAY = 86400;

/** Teachers with their classes mapped to the shared ClassWork shape, plus a flat class list. */
export function mapSchool(school: ApiSchool, now = Date.now() / 1000): SchoolData {
  const teachers = school.teachers.map((t) => ({ id: t.id, name: t.name, classes: t.classes.map((c) => mapClassWork(c, now)) }));
  const seen = new Set<string>();
  const classes = teachers.flatMap((t) =>
    t.classes.flatMap((c) => {
      if (seen.has(c.id)) return [];
      seen.add(c.id);
      return [{ ...c, teacherId: t.id, teacherName: t.name }];
    }),
  );
  return { id: school.id, name: school.name, teachers, classes };
}

/** Work students can see (drafts are the teacher's own). */
export const publishedWorks = (classes: ClassWork[]): Work[] => classes.flatMap((c) => c.works.filter((w) => w.status !== 'draft'));

/** "Мұғалімдер белсенділігі": published work each teacher gave since `after` (null: all time). */
export function teacherActivity(teachers: SchoolTeacher[], after: number | null): { id: string; name: string; count: number }[] {
  const since = after ?? 0;
  return teachers.map((t) => ({ id: t.id, name: t.name, count: publishedWorks(t.classes).filter((w) => w.createdAt >= since).length }));
}

/** Active: gave work or received an answer in the last `days` days. */
export function isActiveTeacher(teacher: SchoolTeacher, now = Date.now() / 1000, days = 30): boolean {
  const since = now - days * DAY;
  return publishedWorks(teacher.classes).some((w) => w.createdAt >= since || w.attempts.some((a) => a.createdAt >= since));
}

/** Average of every scored attempt in the classes, null when nothing is scored. */
export function averageScore(classes: ClassWork[]): number | null {
  const scores = publishedWorks(classes).flatMap((w) => w.attempts.flatMap((a) => (a.pending || a.score == null ? [] : [a.score])));
  return scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null;
}

/** Props for the class table cards. */
export const classRows = (school: SchoolData) =>
  school.classes.map((c) => ({
    id: c.id,
    name: c.name,
    teacherName: c.teacherName,
    studentCount: c.students.length,
    workCount: publishedWorks([c]).length,
  }));

/** Props for the teacher cards. */
export const teacherRows = (school: SchoolData, now = Date.now() / 1000) =>
  school.teachers.map((t) => ({
    id: t.id,
    name: t.name,
    classNames: t.classes.map((c) => c.name),
    active: isActiveTeacher(t, now),
    workCount: publishedWorks(t.classes).length,
  }));
