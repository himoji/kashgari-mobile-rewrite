import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';
import { mapClassWorkCached, type ClassWork, type Work } from '@/features/classes/class-data';
import { TEACHER_SCHOOL } from '@/features/teacher-assignments/gql';

/** The teacher's classes and works (one cached request shared by every School screen). */
export function useTeacherSchool() {
  const { profileId } = useProfile();
  const query = useQuery(TEACHER_SCHOOL, { variables: { teacherId: profileId } });
  const teacher = query.data?.teacher;
  const classes = useMemo<ClassWork[]>(() => (teacher ? teacher.classes.map(mapClassWorkCached) : []), [teacher]);
  return {
    classes,
    schoolId: teacher?.school?.id ?? null,
    loading: query.loading && !query.data,
    error: query.error,
    refetch: query.refetch,
    refreshing: query.loading && !!query.data,
  };
}

export function findWork(classes: ClassWork[], key: string): { work: Work; classWork: ClassWork } | null {
  for (const classWork of classes) {
    const work = classWork.works.find((w) => w.key === key);
    if (work) return { work, classWork };
  }
  return null;
}
