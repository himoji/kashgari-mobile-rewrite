import { useSuspenseQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';
import { mapClassWorkCached, type ClassWork, type Work } from '@/features/classes/class-data';
import { TEACHER_SCHOOL } from '@/features/teacher-assignments/gql';
import { useRetryKey } from '@/ui/query-boundary';

/**
 * The teacher's classes and works (one cached request shared by every School screen). Suspends: call
 * it inside a `QueryBoundary`; pull-to-refresh goes through `useRefresh(TEACHER_SCHOOL)`.
 */
export function useTeacherSchool() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(TEACHER_SCHOOL, { variables: { teacherId: profileId }, queryKey });
  const teacher = data.teacher;
  const classes = useMemo<ClassWork[]>(() => (teacher ? teacher.classes.map(mapClassWorkCached) : []), [teacher]);
  return { classes, schoolId: teacher?.school?.id ?? null };
}

export function findWork(classes: ClassWork[], key: string): { work: Work; classWork: ClassWork } | null {
  for (const classWork of classes) {
    const work = classWork.works.find((w) => w.key === key);
    if (work) return { work, classWork };
  }
  return null;
}
