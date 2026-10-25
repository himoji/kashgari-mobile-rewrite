import { averageScore, isCompleted, type StudentAssignment } from '@/features/assignments/map';
import type { AssignmentKind } from '@/features/assignments/routes';
import { className } from '@/features/classes/format';
import type { ChildrenQuery, ChildrenWordsQuery } from '@/graphql/graphql';

type ApiParent = NonNullable<ChildrenQuery['parent']>;

/** One child as the parent sees it: a student profile of a linked child account. */
export interface Child {
  /** Student profile id (routes and student queries use it). */
  id: string;
  name: string;
  className: string;
  schoolName: string | null;
  teacherName: string;
  streak: number;
  level: string;
}

/** Every student profile of every linked child account (an account can study in several classes). */
export function mapChildren(parent: ApiParent | null | undefined): Child[] {
  if (!parent) return [];
  return parent.children.flatMap((account) =>
    account.studentProfiles.map((s) => ({
      id: s.id,
      name: s.name,
      className: className(s.class),
      schoolName: s.class.teacher.school?.name ?? null,
      teacherName: s.class.teacher.name,
      streak: account.streak,
      level: account.languageLevel,
    })),
  );
}

/** Module order on the child page (same as the student's module labels). */
export const MODULE_ORDER: AssignmentKind[] = ['oqylym', 'tyndalym', 'durys', 'oyna', 'zhazylym', 'lesson'];

export interface ModuleSummary {
  kind: AssignmentKind;
  total: number;
  done: number;
  /** Average of the scored work in this module, undefined when nothing is scored. */
  average?: number;
}

/** Work per module: how much is done and the average score; modules with no work are left out. */
export function moduleBreakdown(list: StudentAssignment[]): ModuleSummary[] {
  return MODULE_ORDER.flatMap((kind) => {
    const items = list.filter((a) => a.kind === kind);
    if (!items.length) return [];
    return [{ kind, total: items.length, done: items.filter(isCompleted).length, average: averageScore(items) }];
  });
}

/** Latest activity first: submitted work by submission time, open work by when it was given. */
export function recentAssignments(list: StudentAssignment[], count = 4): StudentAssignment[] {
  return [...list].sort((a, b) => (b.submittedAt ?? b.createdAt) - (a.submittedAt ?? a.createdAt)).slice(0, count);
}

/** Module page order: open work first (as the student sees it), then completed work. */
export function moduleAssignments(list: StudentAssignment[], kind: AssignmentKind): StudentAssignment[] {
  const items = list.filter((a) => a.kind === kind);
  const open = items.filter((a) => !isCompleted(a)).sort((a, b) => b.createdAt - a.createdAt);
  const done = items.filter(isCompleted).sort((a, b) => (b.submittedAt ?? b.createdAt) - (a.submittedAt ?? a.createdAt));
  return [...open, ...done];
}

type ApiWord = NonNullable<ChildrenWordsQuery['student']>['words'][number];
export type ChildWord = { word: string; level: number };

/** Learned words (no longer pending) and words still being learned, each alphabetical. */
export function splitWords(words: ApiWord[]): { learned: ChildWord[]; learning: ChildWord[] } {
  const sort = (list: ApiWord[]) =>
    list.map((w) => ({ word: w.word, level: w.level })).sort((a, b) => a.word.localeCompare(b.word, 'kk'));
  return { learned: sort(words.filter((w) => !w.isPending)), learning: sort(words.filter((w) => w.isPending)) };
}
