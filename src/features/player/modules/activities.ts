import type { UiLanguage } from '@/features/auth/session';
import type {
  PlayerAssignmentFieldsFragment,
  PlayerDurysFieldsFragment,
  PlayerLessonQuery,
  PlayerZhazylymFieldsFragment,
} from '@/graphql/graphql';

import type { FreeTextStep, Step } from '../engine/types';
import { assignmentSteps } from './assignment';
import { durysSteps } from './durys';

/** One submittable piece of work: a whole assignment, or one activity of a lesson. */
export type Activity =
  | { kind: 'assignment'; id: string; group: string; steps: Step[] }
  | { kind: 'zhazylym'; id: string; group: string; steps: Step[] }
  | { kind: 'durys'; id: string; group: string; steps: Step[] }
  | { kind: 'oyna'; id: string; group: string; steps: Step[] };

export function zhazylymStep(z: PlayerZhazylymFieldsFragment, group: string): FreeTextStep {
  const images = z.__typename === 'ImageZhazylym' ? z.imagesDownload.filter((u): u is string => !!u) : [];
  return {
    id: `${group}:writing`,
    kind: 'text',
    label: 'writing',
    display: images.length ? 'imageStory' : 'story',
    group,
    prompts: [{ question: '' }],
    words: z.words,
    minWords: z.minWords || undefined,
    images,
  };
}

export const assignmentActivity = (a: PlayerAssignmentFieldsFragment, lang: UiLanguage, group = 'a'): Activity => ({
  kind: 'assignment',
  id: a.id,
  group,
  steps: assignmentSteps(a, group, lang),
});

export const zhazylymActivity = (z: PlayerZhazylymFieldsFragment, group = 'z'): Activity => ({
  kind: 'zhazylym',
  id: z.id,
  group,
  steps: [zhazylymStep(z, group)],
});

export const durysActivity = (d: PlayerDurysFieldsFragment, group = 'd'): Activity => ({
  kind: 'durys',
  id: d.id,
  group,
  steps: durysSteps(d.durysTitle.xmls, group),
});

type Lesson = NonNullable<PlayerLessonQuery['lesson']>;

/** A lesson's activities the student still has to do, in the teacher's order. */
export function lessonActivities(lesson: Lesson, lang: UiLanguage): Activity[] {
  const out: Activity[] = [];
  lesson.activities.forEach((act, i) => {
    const group = `act${i}`;
    switch (act.__typename) {
      case 'TextActivity': {
        const a = act.text?.assignment;
        if (a && !a.submission) out.push(assignmentActivity(a, lang, group));
        break;
      }
      case 'ZhazylymActivity':
        if (act.zhazylym && !act.zhazylym.submission) out.push(zhazylymActivity(act.zhazylym, group));
        break;
      case 'DurysActivity':
        if (act.assignment && !act.assignment.submission) out.push(durysActivity(act.assignment, group));
        break;
      case 'OynaActivity': {
        const game = act.game;
        if (game && !game.submission)
          out.push({
            kind: 'oyna',
            id: game.id,
            group,
            steps: [{ id: `${group}:oyna`, kind: 'link', label: 'oyna', group, name: game.name, href: `/student/play/oyna/${game.id}?game=${game.__typename}` }],
          });
        break;
      }
    }
  });
  return out;
}
