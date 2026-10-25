import { useSuspenseQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';
import { useRetryKey } from '@/ui/query-boundary';

import { STUDENT_ASSIGNMENTS } from './gql';
import { mapAssignments, sortCompleted, sortNew } from './map';

/**
 * The signed-in student's work from every module, split into new and completed. Suspends: call it
 * inside a `QueryBoundary`; pull-to-refresh goes through `useRefresh(STUDENT_ASSIGNMENTS)`.
 */
export function useStudentAssignments() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  // errorPolicy 'all': one broken field (the API can throw on a lesson submission's createdAt)
  // must not blank the whole list; that field comes back null instead.
  const { data } = useSuspenseQuery(STUDENT_ASSIGNMENTS, { variables: { studentId: profileId }, queryKey, errorPolicy: 'all' });
  const cls = data?.student?.class;
  return useMemo(() => {
    const all = mapAssignments(cls);
    return { all, fresh: sortNew(all), completed: sortCompleted(all) };
  }, [cls]);
}
