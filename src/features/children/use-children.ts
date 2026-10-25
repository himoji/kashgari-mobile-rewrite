import { useQuery, useSuspenseQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { mapAssignments } from '@/features/assignments/map';
import { STUDENT_ASSIGNMENTS } from '@/features/assignments/gql';
import { useProfile } from '@/features/auth/session';
import { CHILDREN } from '@/features/children/gql';
import { mapChildren } from '@/features/children/children-data';
import { useRetryKey } from '@/ui/query-boundary';

/**
 * The signed-in parent's children (one cached request for the home and every child page). Suspends:
 * call it inside a `QueryBoundary`; pull-to-refresh goes through `useRefresh(CHILDREN)`.
 */
export function useChildren() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(CHILDREN, { variables: { parentId: profileId }, queryKey });
  const parent = data.parent;
  const children = useMemo(() => mapChildren(parent), [parent]);
  return { children };
}

/**
 * A child's name for the back bar of a child page. Does not suspend: the bar is chrome, so it shows
 * "back" until the children are known (usually already cached by the home screen).
 */
export function useChildName(childId: string): string | undefined {
  const { profileId } = useProfile();
  const { data } = useQuery(CHILDREN, { variables: { parentId: profileId } });
  const parent = data?.parent;
  return useMemo(() => mapChildren(parent).find((c) => c.id === childId)?.name, [parent, childId]);
}

/**
 * A child's school work from every module: the student's own assignments query, asked for the child.
 * Suspends: call it inside a `QueryBoundary`.
 */
export function useChildAssignments(studentId: string) {
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(STUDENT_ASSIGNMENTS, { variables: { studentId }, queryKey });
  const cls = data.student?.class;
  const all = useMemo(() => mapAssignments(cls), [cls]);
  return { all };
}
