import fixture from '@/dev/mocks/StudentAssignments';
import type { StudentAssignmentsQuery } from '@/graphql/graphql';

import { averageScore, canStart, deadlineLabel, mapAssignments, sortCompleted, sortNew } from '../map';

const cls = (fixture() as unknown as StudentAssignmentsQuery).student!.class;
const now = Date.now() / 1000;

describe('mapAssignments', () => {
  const all = mapAssignments(cls, now);
  const byId = Object.fromEntries(all.map((a) => [a.id, a]));

  it('collects work from every module', () => {
    expect(all).toHaveLength(10);
    expect(new Set(all.map((a) => a.kind))).toEqual(new Set(['tyndalym', 'zhazylym', 'oyna', 'durys', 'lesson']));
  });

  it('derives state, status and score', () => {
    expect(byId.a1).toMatchObject({ state: 'waiting', status: 'pending', score: undefined, minutes: 15 });
    expect(byId.a7).toMatchObject({ state: 'overdue', status: 'failed' });
    expect(byId.a2).toMatchObject({ state: 'done', status: 'done', score: 91, minutes: 12 });
    expect(byId.a6).toMatchObject({ state: 'done', kind: 'oyna', game: 'wordle', score: 86 });
    expect(byId.a4).toMatchObject({ state: 'notStarted', kind: 'durys' });
    expect(byId.l1).toMatchObject({ state: 'notStarted', kind: 'lesson', minutes: 45 });
  });

  it('skips work that is hidden or not open yet', () => {
    const hidden = { ...cls, lessons: cls.lessons.map((l) => ({ ...l, opensAt: now + 100 })), assignments: cls.assignments.map((a) => ({ ...a, visible: false })) };
    expect(mapAssignments(hidden, now).filter((a) => a.kind === 'lesson' || a.kind === 'tyndalym')).toHaveLength(0);
  });

  it('marks lessons in progress or done from their activity submissions', () => {
    const l = cls.lessons[0]!;
    const sub = (parts: ({ __typename: 'Submission' } | null)[]) => ({ ...cls, lessons: [{ ...l, submission: { createdAt: 5, submissions: parts } }] });
    expect(mapAssignments(sub([{ __typename: 'Submission' }, null]), now).find((a) => a.id === l.id)?.state).toBe('inProgress');
    expect(mapAssignments(sub([{ __typename: 'Submission' }]), now).find((a) => a.id === l.id)).toMatchObject({ state: 'done', submittedAt: 5 });
  });

  it('treats the max-int deadline as none', () => {
    const c = { ...cls, assignments: cls.assignments.map((a) => ({ ...a, deadline: 2147483647, submission: null })) };
    expect(mapAssignments(c, now)[0]).toMatchObject({ deadline: undefined, state: 'notStarted' });
  });

  it('splits and sorts new and completed work', () => {
    expect(sortNew(all).map((a) => a.id).slice(0, 2)).toEqual(['a7', 'a9']);
    expect(sortNew(all)).toHaveLength(7);
    expect(sortCompleted(all).map((a) => a.id)).toEqual(['a1', 'a2', 'a6']);
    expect(averageScore(sortCompleted(all))).toBe(89);
  });

  it('starts only open work: overdue and submitted work have nothing to start', () => {
    expect(canStart(byId.a7!)).toBe(false);
    expect(canStart(byId.a2!)).toBe(false);
    expect(canStart(byId.l1!)).toBe(true);
  });
});

describe('deadlineLabel', () => {
  const today = new Date(2026, 9, 24, 15, 0);
  const at = (d: Date) => d.getTime() / 1000;
  it('words today, days left and past dates', () => {
    expect(deadlineLabel(at(new Date(2026, 9, 24, 23, 59)), today)).toEqual({ kind: 'today' });
    expect(deadlineLabel(at(new Date(2026, 9, 28, 1, 0)), today)).toEqual({ kind: 'left', days: 4 });
    expect(deadlineLabel(at(new Date(2026, 8, 30, 12, 0)), today)).toEqual({ kind: 'date', day: 30, month: 8 });
  });
});
