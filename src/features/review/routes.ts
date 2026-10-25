import type { Href } from 'expo-router';

import type { ReviewKind } from '@/features/classes/class-data';

/** /teacher/submission/[id]?kind=…&work=<work key>: the review screen of one submission. */
export const submissionHref = (attempt: { id: string; reviewKind: ReviewKind | null }, workKey: string): Href =>
  ({ pathname: '/teacher/submission/[id]', params: { id: attempt.id, kind: attempt.reviewKind ?? 'assignment', work: workKey } }) as unknown as Href;
