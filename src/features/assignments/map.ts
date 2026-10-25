import type { StudentAssignmentsQuery } from '@/graphql/graphql';
import type { Status } from '@/ui/status-mark';

import type { AssignmentKind, OynaGameType } from './routes';

/**
 * done: submitted (and graded where grading applies). waiting: submitted, the teacher has not graded it yet.
 * inProgress: a lesson with some activities submitted. overdue: not submitted and past the deadline.
 */
export type AssignmentState = 'done' | 'waiting' | 'inProgress' | 'overdue' | 'notStarted';

export type StudentAssignment = {
  id: string;
  kind: AssignmentKind;
  game?: OynaGameType;
  title: string;
  minutes?: number;
  /** Unix seconds; undefined when the work has no deadline. */
  deadline?: number;
  state: AssignmentState;
  /** StatusMark look for the state. */
  status: Status;
  /** 0..100 when the work has a score. */
  score?: number;
  /** Unix seconds of the student's submission. */
  submittedAt?: number;
  createdAt: number;
};

type ClassData = NonNullable<StudentAssignmentsQuery['student']>['class'];

/** The API's "no deadline" value (max int32). */
const NO_DEADLINE = 2147483647;
const ZHAZYLYM_MAX_POINTS = 10;

const oynaGame: Record<ClassData['oynaGames'][number]['__typename'], OynaGameType> = {
  OynaGameMiniStory: 'miniStory',
  OynaGameWordle: 'wordle',
  OynaGameQuizlet: 'quizlet',
  OynaGameWordGame: 'wordGame',
};

export const statusOf: Record<AssignmentState, Status> = {
  done: 'done',
  waiting: 'pending',
  inProgress: 'pending',
  overdue: 'failed',
  notStarted: 'pending',
};

const minutesOf = (seconds: number | null | undefined) => (seconds ? Math.max(1, Math.round(seconds / 60)) : undefined);
const deadlineOf = (d: number) => (d > 0 && d !== NO_DEADLINE ? d : undefined);
const pct = (part: number, whole: number) => (whole > 0 && part >= 0 && part <= whole ? Math.round((part / whole) * 100) : undefined);

function openState(deadline: number | undefined, now: number): AssignmentState {
  return deadline != null && deadline < now ? 'overdue' : 'notStarted';
}

function item(fields: Omit<StudentAssignment, 'status'>): StudentAssignment {
  return { ...fields, status: statusOf[fields.state] };
}

/** One flat list of the student's work from every module. `now` is unix seconds. */
export function mapAssignments(cls: ClassData | undefined, now = Date.now() / 1000): StudentAssignment[] {
  if (!cls) return [];
  const list: StudentAssignment[] = [];

  for (const a of cls.assignments) {
    if (!a.visible) continue;
    const deadline = deadlineOf(a.deadline);
    const sub = a.submission;
    let score: number | undefined;
    if (sub) {
      const games = [sub.wordShuffle, sub.wordMatch, sub.trueFalse, sub.multipleChoice, sub.wordGrid, sub.crossword, sub.completeV2];
      const total = games.reduce((n, g) => n + (g?.total ?? 0), 0);
      const correct = games.reduce((n, g) => n + (g?.correct ?? 0), 0);
      score = pct(correct, total);
    }
    list.push(
      item({
        id: a.id,
        kind: a.__typename === 'TyndalymAssignment' ? 'tyndalym' : 'oqylym',
        title: a.name,
        minutes: minutesOf(a.duration),
        deadline,
        state: sub ? 'done' : openState(deadline, now),
        score,
        submittedAt: sub?.createdAt,
        createdAt: a.createdAt,
      }),
    );
  }

  for (const z of cls.zhazylymAssignments) {
    if (z.opensAt > now) continue;
    const deadline = deadlineOf(z.deadline);
    const sub = z.submission;
    list.push(
      item({
        id: z.id,
        kind: 'zhazylym',
        title: z.name,
        minutes: minutesOf(z.duration),
        deadline,
        state: sub ? (sub.points == null ? 'waiting' : 'done') : openState(deadline, now),
        score: sub?.points != null ? pct(sub.points, ZHAZYLYM_MAX_POINTS) : undefined,
        submittedAt: sub?.createdAt,
        createdAt: z.createdAt,
      }),
    );
  }

  for (const g of cls.oynaGames) {
    const sub = g.submission;
    list.push(
      item({
        id: g.id,
        kind: 'oyna',
        game: oynaGame[g.__typename],
        title: g.name,
        minutes: minutesOf(g.duration),
        // Mini stories are graded by the teacher: no points yet means the answer waits for review.
        state: sub ? (sub.points == null ? 'waiting' : 'done') : 'notStarted',
        score: sub?.points != null ? pct(sub.points, g.maxPoints) : undefined,
        submittedAt: sub?.createdAt,
        createdAt: g.createdAt,
      }),
    );
  }

  for (const d of cls.durysAssignments) {
    list.push(
      item({
        id: d.id,
        kind: 'durys',
        title: d.durysTitle.title,
        state: d.submission ? 'done' : 'notStarted',
        createdAt: d.createdAt,
      }),
    );
  }

  for (const l of cls.lessons) {
    if (!l.visible || l.opensAt > now) continue;
    const parts = l.submission?.submissions ?? [];
    const submitted = parts.filter(Boolean).length;
    const state: AssignmentState =
      parts.length > 0 && submitted === parts.length ? 'done' : submitted > 0 ? 'inProgress' : 'notStarted';
    const minutes = l.activities.reduce((n, a) => {
      if (a.__typename === 'TextActivity') return n + a.estTimeText + a.estTimeGames;
      if (a.__typename === 'OynaActivity' || a.__typename === 'DurysActivity') return n + a.estTime;
      return n;
    }, 0);
    list.push(
      item({
        id: l.id,
        kind: 'lesson',
        title: l.name,
        minutes: minutes > 0 ? Math.max(1, Math.round(minutes)) : undefined,
        state,
        submittedAt: state === 'done' ? (l.submission?.createdAt ?? undefined) : undefined,
        createdAt: l.opensAt,
      }),
    );
  }

  return list;
}

export const isCompleted = (a: StudentAssignment) => a.state === 'done' || a.state === 'waiting';

/** The player refuses unsubmitted work past its deadline, so overdue work has nothing to start. */
export const canStart = (a: StudentAssignment) => !isCompleted(a) && a.state !== 'overdue';

/** New work: overdue first, then by nearest deadline; work without a deadline last, newest first. */
export function sortNew(list: StudentAssignment[]) {
  return list
    .filter((a) => !isCompleted(a))
    .toSorted((a, b) => {
      if (a.deadline != null && b.deadline != null) return a.deadline - b.deadline;
      if (a.deadline != null) return -1;
      if (b.deadline != null) return 1;
      return b.createdAt - a.createdAt;
    });
}

/** Completed work, most recently submitted first. */
export function sortCompleted(list: StudentAssignment[]) {
  return list.filter(isCompleted).toSorted((a, b) => (b.submittedAt ?? b.createdAt) - (a.submittedAt ?? a.createdAt));
}

/** Rounded average of the scored items, or undefined when nothing has a score yet. */
export function averageScore(list: StudentAssignment[]) {
  const scores = list.flatMap((a) => (a.score != null ? [a.score] : []));
  return scores.length ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length) : undefined;
}

export type DeadlineLabel = { kind: 'today' } | { kind: 'left'; days: number } | { kind: 'date'; day: number; month: number };

/** Calendar days from today to the deadline, as the design words it: today / N days left / the past date. */
export function deadlineLabel(deadline: number, now: Date): DeadlineLabel {
  const d = new Date(deadline * 1000);
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((dayStart(d) - dayStart(now)) / 86400000);
  if (days === 0) return { kind: 'today' };
  if (days > 0) return { kind: 'left', days };
  return { kind: 'date', day: d.getDate(), month: d.getMonth() };
}
