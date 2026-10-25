import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import { useProfile } from '@/features/auth/session';
import { SCHOOL_PRINCIPAL } from '@/features/school/gql';
import { mapSchool, type SchoolData } from '@/features/school/school-data';

/** The principal's school (teachers, classes, works), one cached request for every principal screen. */
export function useSchool() {
  const { profileId } = useProfile();
  const query = useQuery(SCHOOL_PRINCIPAL, { variables: { principalId: profileId } });
  const school = query.data?.principal?.school;
  const data = useMemo<SchoolData | null>(() => (school ? mapSchool(school) : null), [school]);
  return {
    school: data,
    loading: query.loading && !query.data,
    error: query.error && !query.data ? query.error : undefined,
    refreshing: query.loading && !!query.data,
    refetch: () => void query.refetch(),
  };
}
