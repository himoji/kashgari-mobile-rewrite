import type { ApolloCache } from '@apollo/client';

/**
 * Removes a deleted object from the cache. Lists that referenced it skip it on their next read,
 * so every screen drops it without a refetch.
 */
export function evictEntity(cache: ApolloCache, __typename: string, id: string) {
  cache.evict({ id: cache.identify({ __typename, id }) });
  cache.gc();
}

/**
 * Forgets some fields of one object. Mounted queries that read them miss in the cache and refetch,
 * which reloads only the screens that show the changed data.
 */
export function evictFields(cache: ApolloCache, __typename: string, id: string, fieldNames: string[]) {
  const target = cache.identify({ __typename, id });
  for (const fieldName of fieldNames) cache.evict({ id: target, fieldName });
  cache.gc();
}

/** After a student submits a work: its submission and the student's acorns reload where shown. */
export function evictSubmission(cache: ApolloCache, work: { __typename: string; id: string }, studentId: string) {
  evictFields(cache, work.__typename, work.id, ['submission']);
  evictFields(cache, 'Student', studentId, ['acorns']);
}
