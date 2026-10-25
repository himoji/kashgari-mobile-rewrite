import { hasUngradedAnswer } from '@/features/classes/class-data';
import type { TeacherHomeQuery } from '@/graphql/graphql';

type Teacher = NonNullable<TeacherHomeQuery['teacher']>;

/**
 * Answers waiting for the teacher: open-question answers without a grade, and writing / mini-story
 * submissions without points. Everything else is checked automatically.
 */
export function countAwaitingReview(teacher: Pick<Teacher, 'classes'> | null | undefined): number {
  if (!teacher) return 0;
  let count = 0;
  for (const cls of teacher.classes) {
    for (const assignment of cls.assignments) {
      for (const submission of assignment.submissions) {
        if (hasUngradedAnswer(submission.freeResponse)) count += 1;
      }
    }
    for (const writing of cls.zhazylymAssignments) count += writing.submissions.filter((s) => s.points == null).length;
    for (const game of cls.oynaGames) {
      // Only mini stories are graded by hand; other games select no submissions here.
      if ('submissions' in game) count += game.submissions.filter((s) => s.points == null).length;
    }
  }
  return count;
}

/** "Айгүл Қасымова" → "Айгүл" (the design greets by first name). */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
