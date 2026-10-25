import { useQuery } from '@apollo/client/react';

import { useProfile } from '@/features/auth/session';
import { MATERIALS_CONTEXT } from '@/features/materials/gql';

/** School grades 1–11 have a curriculum; the API also stores extra collections under grades 21+. */
const isSchoolGrade = (g: number) => g >= 1 && g <= 11;

/** Grades the teacher can browse and the one to open first (their first class's grade). */
export function useGrades() {
  const { profileId } = useProfile();
  const { data, loading, error, refetch } = useQuery(MATERIALS_CONTEXT, { variables: { teacherId: profileId } });
  const grades = (data?.allGrades ?? []).map((g) => g.grade).filter(isSchoolGrade).sort((a, b) => a - b);
  const classGrade = data?.teacher?.classes.map((c) => c.grade).find((g): g is number => g != null && grades.includes(g));
  return { grades, defaultGrade: classGrade ?? grades[0] ?? null, loading, error, refetch };
}
