import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { mapAssignments } from '@/features/assignments/map';
import { STUDENT_ASSIGNMENTS } from '@/features/assignments/gql';
import { useProfile } from '@/features/auth/session';
import { CHILDREN } from '@/features/children/gql';
import { mapChildren } from '@/features/children/children-data';

/** The signed-in parent's children (one cached request for the home and every child page). */
export function useChildren() {
  const { profileId } = useProfile();
  const query = useQuery(CHILDREN, { variables: { parentId: profileId } });
  const parent = query.data?.parent;
  const children = useMemo(() => mapChildren(parent), [parent]);
  return {
    children,
    loading: query.loading && !query.data,
    error: query.error && !query.data ? query.error : undefined,
    refreshing: query.loading && !!query.data,
    refetch: () => void query.refetch(),
  };
}

/** A child's school work from every module: the student's own assignments query, asked for the child. */
export function useChildAssignments(studentId: string) {
  const query = useQuery(STUDENT_ASSIGNMENTS, { variables: { studentId }, fetchPolicy: 'cache-and-network' });
  const cls = query.data?.student?.class;
  const all = useMemo(() => mapAssignments(cls), [cls]);
  return {
    all,
    loading: query.loading && !query.data,
    error: query.error && !query.data ? query.error : undefined,
    refetch: () => void query.refetch(),
  };
}
