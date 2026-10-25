import type { ClassWorkFragment } from '@/graphql/graphql';
import { className, percent } from '@/features/classes/format';

/** Route segment of /teacher/assignment/[kind]/[id]. */
export type WorkKind = 'oqylym' | 'tyndalym' | 'zhazylym' | 'oyna' | 'durys' | 'lesson';
export type WorkStatus = 'published' | 'draft' | 'scheduled';
/** Which submission query / grading mutation opens a submission. */
export type ReviewKind = 'assignment' | 'zhazylym' | 'miniStory' | 'wordle' | 'quizlet' | 'wordGame';
/** Exercise / activity labels (keys of classes.content.*). */
export type ContentKey =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'ministory'
  | 'wordle'
  | 'match'
  | 'wordGame'
  | 'grammar'
  | 'game'
  | 'physical';

export interface StudentRef {
  id: string;
  name: string;
}

/** One student's latest submission of one work. */
export interface Attempt {
  id: string;
  studentId: string;
  createdAt: number;
  /** Waiting for the teacher's score (writing, mini story, open-question answers). */
  pending: boolean;
  /** 0..100, null when the work has no score (grammar, lessons) or it is still pending. */
  score: number | null;
  /** null: the submission has no review screen. */
  reviewKind: ReviewKind | null;
}

export interface Work {
  /** `${kind}:${id}`, unique across kinds. */
  key: string;
  kind: WorkKind;
  id: string;
  /** API typename for oyna games / zhazylym (decides delete mutation, labels). */
  typename: string;
  name: string;
  classId: string;
  className: string;
  /** Shown date (deadline, opening day or creation), unix seconds. */
  date: number;
  createdAt: number;
  status: WorkStatus;
  studentIds: string[];
  /** Latest attempt per eligible student. */
  attempts: Attempt[];
  /** Known without an extra request (everything except reading / listening exercises). */
  contents: ContentKey[] | null;
  /** Grammar works: the "Дұрыс" exercise set they use. */
  durysTitleId?: string;
}

export interface ClassWork {
  id: string;
  name: string;
  students: StudentRef[];
  works: Work[];
}

type Scored = { correct: number; total: number } | null | undefined;

/** Auto-checked reading / listening exercises: all correct answers over all questions. */
export function assignmentScore(parts: Scored[]): number | null {
  let correct = 0;
  let total = 0;
  for (const p of parts) {
    if (!p) continue;
    correct += p.correct;
    total += p.total;
  }
  return total > 0 ? percent(correct, total) : null;
}

/** An open question the student answered and the teacher has not scored yet. */
export function hasUngradedAnswer(fr: { questions: { answer?: string | null; grade?: number | null }[] } | null | undefined): boolean {
  return !!fr?.questions.some((q) => q.answer != null && q.answer.trim() !== '' && q.grade == null);
}

/** Teacher-graded work is scored 0..10 by the API. */
export const MANUAL_MAX_POINTS = 10;

const OYNA_KIND: Record<string, { review: ReviewKind; content: ContentKey }> = {
  OynaGameMiniStory: { review: 'miniStory', content: 'ministory' },
  OynaGameWordle: { review: 'wordle', content: 'wordle' },
  OynaGameQuizlet: { review: 'quizlet', content: 'match' },
  OynaGameWordGame: { review: 'wordGame', content: 'wordGame' },
};

const LESSON_CONTENT: Record<string, ContentKey> = {
  oqylym: 'reading',
  tyndalym: 'listening',
  zhazylym: 'writing',
  miniStory: 'ministory',
  quizlet: 'match',
  wordle: 'wordle',
  wordGame: 'wordGame',
  lesson_game: 'game',
  durys_assignment: 'grammar',
  physical_activity: 'physical',
};

/** Keeps the newest attempt per student, only for students the work is for. */
function latestPerStudent(attempts: Attempt[], studentIds: string[]): Attempt[] {
  const allowed = new Set(studentIds);
  const byStudent = new Map<string, Attempt>();
  for (const a of attempts) {
    if (!allowed.has(a.studentId)) continue;
    const prev = byStudent.get(a.studentId);
    if (!prev || a.createdAt > prev.createdAt) byStudent.set(a.studentId, a);
  }
  // Roster order, like the design's lists.
  return studentIds.flatMap((id) => byStudent.get(id) ?? []);
}

/** Turns one class (ClassWork fragment) into the flat work list every School screen reads. */
export function mapClassWork(c: ClassWorkFragment, now = Date.now() / 1000): ClassWork {
  const name = className(c);
  const students = c.students.map((s) => ({ id: s.id, name: s.name }));
  const roster = students.map((s) => s.id);
  const base = { classId: c.id, className: name };
  const works: Work[] = [];

  for (const a of c.assignments) {
    const kind: WorkKind = a.__typename === 'TyndalymAssignment' ? 'tyndalym' : 'oqylym';
    const attempts = a.submissions.map((s) => {
      const score = assignmentScore([s.wordShuffle, s.wordMatch, s.completeV2, s.trueFalse, s.multipleChoice, s.wordGrid, s.crossword]);
      return { id: s.id, studentId: s.student.id, createdAt: s.createdAt, pending: hasUngradedAnswer(s.freeResponse), score, reviewKind: 'assignment' as const };
    });
    works.push({
      ...base,
      key: `${kind}:${a.id}`,
      kind,
      id: a.id,
      typename: a.__typename,
      name: a.name,
      date: a.deadline,
      createdAt: a.createdAt,
      status: a.visible ? 'published' : 'draft',
      studentIds: roster,
      attempts: latestPerStudent(attempts, roster),
      contents: null,
    });
  }

  for (const z of c.zhazylymAssignments) {
    const attempts = z.submissions.map((s) => ({
      id: s.id,
      studentId: s.student.id,
      createdAt: s.createdAt,
      pending: s.points == null,
      score: s.points == null ? null : percent(s.points, MANUAL_MAX_POINTS),
      reviewKind: 'zhazylym' as const,
    }));
    works.push({
      ...base,
      key: `zhazylym:${z.id}`,
      kind: 'zhazylym',
      id: z.id,
      typename: z.__typename,
      name: z.name,
      date: z.deadline,
      createdAt: z.createdAt,
      status: z.opensAt > now ? 'scheduled' : 'published',
      studentIds: roster,
      attempts: latestPerStudent(attempts, roster),
      contents: ['writing'],
    });
  }

  for (const g of c.oynaGames) {
    const type = OYNA_KIND[g.__typename] ?? { review: 'wordGame', content: 'game' };
    const manual = type.review === 'miniStory';
    const attempts = g.submissions.map((s) => ({
      id: s.id,
      studentId: s.student.id,
      createdAt: s.createdAt,
      pending: manual && s.points == null,
      score: s.points == null ? null : percent(s.points, manual ? MANUAL_MAX_POINTS : g.maxPoints),
      reviewKind: type.review,
    }));
    works.push({
      ...base,
      key: `oyna:${g.id}`,
      kind: 'oyna',
      id: g.id,
      typename: g.__typename,
      name: g.name,
      date: g.createdAt,
      createdAt: g.createdAt,
      status: 'published',
      studentIds: roster,
      attempts: latestPerStudent(attempts, roster),
      contents: [type.content],
    });
  }

  for (const d of c.durysAssignments) {
    const attempts = c.students.flatMap((s) =>
      s.durysSubmissions
        .filter((x) => x.assignment.id === d.id)
        .map((x) => ({ id: x.id, studentId: s.id, createdAt: x.createdAt, pending: false, score: null, reviewKind: null })),
    );
    works.push({
      ...base,
      key: `durys:${d.id}`,
      kind: 'durys',
      id: d.id,
      typename: 'DurysAssignment',
      name: d.durysTitle.title,
      date: d.createdAt,
      createdAt: d.createdAt,
      status: 'published',
      studentIds: roster,
      attempts: latestPerStudent(attempts, roster),
      contents: ['grammar'],
      durysTitleId: d.durysTitle.id,
    });
  }

  for (const l of c.lessons) {
    const studentIds = roster.filter((id) => l.students.some((s) => s.id === id));
    const attempts = l.submissions.flatMap((s) =>
      s.createdAt == null
        ? []
        : [{ id: `${l.id}:${s.student.id}`, studentId: s.student.id, createdAt: s.createdAt, pending: false, score: null, reviewKind: null }],
    );
    works.push({
      ...base,
      key: `lesson:${l.id}`,
      kind: 'lesson',
      id: l.id,
      typename: 'Lesson',
      name: l.name,
      date: l.opensAt,
      createdAt: l.opensAt,
      status: !l.visible ? 'draft' : l.opensAt > now ? 'scheduled' : 'published',
      studentIds,
      attempts: latestPerStudent(attempts, studentIds),
      contents: l.activitiesType.map((t) => LESSON_CONTENT[t] ?? 'game'),
    });
  }

  works.sort((a, b) => b.createdAt - a.createdAt);
  return { id: c.id, name, students, works };
}

export interface WorkNumbers {
  total: number;
  done: number;
  pending: number;
  pct: number;
}

export function workNumbers(w: Work): WorkNumbers {
  const done = w.attempts.length;
  return { total: w.studentIds.length, done, pending: w.attempts.filter((a) => a.pending).length, pct: percent(done, w.studentIds.length) };
}

export interface StudentSummary {
  student: StudentRef;
  submitted: number;
  eligible: number;
  /** Average of scored attempts, null when nothing is scored yet. */
  average: number | null;
}

/** The class roster with each student's submitted count and average (the "Оқушы бағалары" rows). */
export function studentSummaries(c: ClassWork): StudentSummary[] {
  const works = c.works.filter((w) => w.status !== 'draft');
  return c.students.map((student) => {
    const eligible = works.filter((w) => w.studentIds.includes(student.id));
    const attempts = eligible.flatMap((w) => w.attempts.filter((a) => a.studentId === student.id));
    const scores = attempts.flatMap((a) => (a.pending || a.score == null ? [] : [a.score]));
    return {
      student,
      submitted: attempts.length,
      eligible: eligible.length,
      average: scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null,
    };
  });
}

export interface ReviewItem {
  attempt: Attempt;
  work: Work;
  studentName: string;
}

/** Every reviewable submission across the given classes, newest first. */
export function reviewItems(classes: ClassWork[]): ReviewItem[] {
  return classes
    .flatMap((c) => {
      const names = new Map(c.students.map((s) => [s.id, s.name]));
      return c.works.flatMap((work) =>
        work.attempts.flatMap((attempt) =>
          attempt.reviewKind && (attempt.pending || attempt.score != null)
            ? [{ attempt, work, studentName: names.get(attempt.studentId) ?? '' }]
            : [],
        ),
      );
    })
    .sort((a, b) => b.attempt.createdAt - a.attempt.createdAt);
}

/** A student's latest attempt of each work, newest first (the student progress dialog). */
export function studentAttempts(c: ClassWork, studentId: string): { attempt: Attempt; work: Work }[] {
  return c.works
    .flatMap((work) => work.attempts.filter((a) => a.studentId === studentId).map((attempt) => ({ attempt, work })))
    .sort((a, b) => b.attempt.createdAt - a.attempt.createdAt);
}

/** Review navigation inside one work: position, previous / next and the next one still pending. */
export function reviewNavigation(work: Work, attemptId: string) {
  const list = work.attempts.filter((a) => a.reviewKind);
  const index = list.findIndex((a) => a.id === attemptId);
  const rotated = [...list.slice(index + 1), ...list.slice(0, Math.max(index, 0))];
  return {
    list,
    index,
    previous: index > 0 ? list[index - 1] : undefined,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : undefined,
    nextPending: rotated.find((a) => a.pending && a.id !== attemptId),
  };
}
