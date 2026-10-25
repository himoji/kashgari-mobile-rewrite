import { useSuspenseQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';
import { SCHOOL_PRINCIPAL } from '@/features/school/gql';
import { mapSchool, type SchoolData } from '@/features/school/school-data';
import { useRetryKey } from '@/ui/query-boundary';

/**
 * The principal's school (teachers, classes, works), one cached request for every principal screen.
 * Suspends: call it inside a `QueryBoundary`; pull-to-refresh goes through `useRefresh(SCHOOL_PRINCIPAL)`.
 */
export function useSchool() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(SCHOOL_PRINCIPAL, { variables: { principalId: profileId }, queryKey });
  const school = data.principal?.school;
  const mapped = useMemo<SchoolData | null>(() => (school ? mapSchool(school) : null), [school]);
  return { school: mapped };
}
