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
  const { data } = useSuspenseQuery(STUDENT_ASSIGNMENTS, { variables: { studentId: profileId }, queryKey });
  const cls = data.student?.class;
  return useMemo(() => {
    const all = mapAssignments(cls);
    return { all, fresh: sortNew(all), completed: sortCompleted(all) };
  }, [cls]);
}
