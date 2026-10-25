import type { UiLanguage } from '@/features/auth/session';
import type { ResultAssignmentQuery, ResultLessonQuery, ResultZhazylymQuery } from '@/graphql/graphql';

import type { Answers, Step } from '../engine/types';
import { zhazylymStep } from './activities';
import { percent, reviewSteps, scoreSubmission, type Score } from './assignment';

/** What the result page shows; built per kind from the API. */
export type Outcome = {
  title: string;
  submitted: boolean;
  /** Unix seconds, when the API knows it. */
  submittedAt: number | null;
  /** 0..100, or null while waiting for the teacher / for work without a score. */
  score: number | null;
  pending: boolean;
  review: { steps: Step[]; answers: Answers } | null;
};

type Assignment = NonNullable<ResultAssignmentQuery['assignment']>;
type Zhazylym = NonNullable<ResultZhazylymQuery['zhazylym']>;
type Lesson = NonNullable<ResultLessonQuery['lesson']>;

export function assignmentOutcome(a: Assignment, lang: UiLanguage): Outcome {
  const s = a.submission;
  if (!s) return { title: a.name, submitted: false, submittedAt: null, score: null, pending: false, review: null };
  const score = scoreSubmission(s);
  return { title: a.name, submitted: true, submittedAt: s.createdAt, score: score.pending ? null : percent(score), pending: score.pending, review: reviewSteps(a, s, 'a', lang) };
}

export function zhazylymOutcome(z: Zhazylym): Outcome {
  const s = z.submission;
  if (!s) return { title: z.name, submitted: false, submittedAt: null, score: null, pending: false, review: null };
  const step = zhazylymStep(z, 'z');
  return {
    title: z.name,
    submitted: true,
    submittedAt: s.createdAt,
    score: s.points == null ? null : s.points * 10,
    pending: s.points == null,
    review: { steps: [step], answers: { [step.id]: [s.text] } },
  };
}

export function lessonOutcome(lesson: Lesson, lang: UiLanguage): Outcome {
  const total: Score = { correct: 0, total: 0, pending: false };
  const steps: Step[] = [];
  const answers: Answers = {};
  let submittedAt: number | null = null;
  let touched = false;
  const seen = (at: number | null | undefined) => {
    touched = true;
    if (at && (!submittedAt || at > submittedAt)) submittedAt = at;
  };
  lesson.activities.forEach((act, i) => {
    const group = `act${i}`;
    if (act.__typename === 'TextActivity') {
      const a = act.text?.assignment;
      const s = a?.submission;
      if (!a || !s) return;
      seen(s.createdAt);
      const sc = scoreSubmission(s);
      total.correct += sc.correct;
      total.total += sc.total;
      total.pending ||= sc.pending;
      const r = reviewSteps(a, s, group, lang);
      steps.push(...r.steps);
      Object.assign(answers, r.answers);
    } else if (act.__typename === 'ZhazylymActivity') {
      const z = act.zhazylym;
      const s = z?.submission;
      if (!z || !s) return;
      seen(s.createdAt);
      if (s.points == null) total.pending = true;
      else {
        total.correct += s.points;
        total.total += 10;
      }
      const step = zhazylymStep(z, group);
      steps.push(step);
      answers[step.id] = [s.text];
    } else if (act.__typename === 'DurysActivity') {
      if (act.assignment?.submission) seen(null);
    } else if (act.__typename === 'OynaActivity') {
      if (act.game?.submission) seen(act.game.submission.createdAt);
    }
  });
  return {
    title: lesson.name,
    submitted: touched,
    submittedAt,
    score: total.pending ? null : percent(total),
    pending: total.pending,
    review: steps.length ? { steps, answers } : null,
  };
}

