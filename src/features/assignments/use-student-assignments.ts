import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';

import { STUDENT_ASSIGNMENTS } from './gql';
import { mapAssignments, sortCompleted, sortNew } from './map';

/** The signed-in student's work from every module, split into new and completed. */
export function useStudentAssignments() {
  const { profileId } = useProfile();
  const query = useQuery(STUDENT_ASSIGNMENTS, { variables: { studentId: profileId } });
  const cls = query.data?.student?.class;
  const lists = useMemo(() => {
    const all = mapAssignments(cls);
    return { all, fresh: sortNew(all), completed: sortCompleted(all) };
  }, [cls]);
  return {
    ...lists,
    loading: query.loading && !query.data,
    error: query.error && !query.data ? query.error : undefined,
    refreshing: query.networkStatus === NetworkStatus.refetch,
    refetch: () => void query.refetch(),
  };
}
