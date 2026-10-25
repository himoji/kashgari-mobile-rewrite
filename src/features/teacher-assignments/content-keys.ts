import type { TeacherAssignmentContentQuery } from '@/graphql/graphql';

type Content = NonNullable<TeacherAssignmentContentQuery['assignment']>;

/** The exercises of a reading / listening assignment in the player's order (keys of classes.content.*). */
export function contentKeysFromGames(kind: 'oqylym' | 'tyndalym', a: Pick<Content, 'hasFlashcards' | 'games'>): string[] {
  const g = a.games;
  const keys = [kind === 'tyndalym' ? 'listening' : 'reading'];
  if (a.hasFlashcards) keys.push('cards');
  if (g.multipleChoice?.total) keys.push('mcq');
  if (g.trueFalse?.total) keys.push('tf');
  if (g.wordMatch?.total) keys.push('match');
  if (g.wordShuffle?.total) keys.push('shuffle');
  if (g.completeV2?.total) keys.push('complete');
  if (g.wordGrid?.total) keys.push('grid');
  if (g.crossword?.total) keys.push('crossword');
  if (g.freeResponse?.questions.length) keys.push('frq');
  return keys;
}
