import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile, useSession } from '@/features/auth/session';
import { OynaPlayer } from '@/features/oyna/oyna-player';
import { ErrorState, Skeleton } from '@/ui/feedback';
import { Text } from '@/ui/text';

import type { Answers } from './engine/types';
import {
  PlayerAssignmentQuery,
  PlayerDurysQuery,
  PlayerLessonQuery,
  PlayerStudentClassQuery,
  PlayerSubmitAssignment,
  PlayerSubmitDurys,
  PlayerSubmitZhazylym,
  PlayerZhazylymQuery,
} from './gql';
import { buildSubmission } from './modules/assignment';
import { assignmentActivity, durysActivity, lessonActivities, zhazylymActivity, type Activity } from './modules/activities';
import { FocusHeader } from './parts';
import { PlayerShell, type Timing } from './player-shell';

type Kind = 'oqylym' | 'tyndalym' | 'durys' | 'oyna' | 'lesson' | 'zhazylym';

const now = () => Math.floor(Date.now() / 1000);
const resultHref = (kind: Kind, id: string) => ({ pathname: '/student/result/[kind]/[id]', params: { kind, id } }) as unknown as Href;

/** The design's blue notice (locked or expired work) under the back header. */
export function Notice({ text }: { text: string }) {
  return (
    <View className="mb-5 flex-row items-center gap-[9px] rounded-control bg-[#eef1ff] px-4 py-[14px]">
      <Text className="flex-1 font-body text-[14px] leading-[21px] text-[#334ab0]">{text}</Text>
    </View>
  );
}

export function FocusPage({ backLabel, children }: { backLabel: string; children: ReactNode }) {
  return (
    <View className="flex-1 bg-surface">
      <FocusHeader label={backLabel} />
      <View className="px-5 pt-2">{children}</View>
    </View>
  );
}

function Loading() {
  const { t } = useTranslation();
  return (
    <FocusPage backLabel={t('player.back')}>
      <Skeleton className="mb-2 h-6 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/3" />
      <Skeleton className="mb-3 h-32" />
      <Skeleton className="mb-3 h-14" />
      <Skeleton className="h-14" />
    </FocusPage>
  );
}

function Failed({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <FocusPage backLabel={t('player.back')}>
      <ErrorState onRetry={onRetry} />
    </FocusPage>
  );
}

const flashcardWords = (activities: Activity[]) => [
  ...new Set(activities.flatMap((a) => a.steps.flatMap((s) => (s.kind === 'cards' ? s.cards.map((c) => c.word) : s.kind === 'text' ? (s.words ?? []) : [])))),
];

/** Submits every activity of the work in order (a lesson submits each of its activities). */
function useSubmitActivities(kind: Kind, id: string) {
  const { profileId } = useProfile();
  const [submitAssignment] = useMutation(PlayerSubmitAssignment);
  const [submitZhazylym] = useMutation(PlayerSubmitZhazylym);
  const [submitDurys] = useMutation(PlayerSubmitDurys);
  const client = useApolloClient();
  // A retry after a partial failure must not resend activities that already went through.
  const sent = useRef(new Set<string>());
  return async (activities: Activity[], answers: Answers, timing: Timing) => {
    for (const a of activities) {
      if (sent.current.has(a.group)) continue;
      const time = timing[a.group] ?? { text: 0, games: 0 };
      if (a.kind === 'assignment') {
        const { data } = await submitAssignment({
          variables: {
            assignmentId: a.id,
            studentId: profileId,
            answers: buildSubmission(a.steps, answers),
            stats: { timeOnText: time.text, timeOnGames: time.games },
          },
        });
        if (!data?.submitAssignment) throw new Error('submitAssignment returned nothing');
      } else if (a.kind === 'zhazylym') {
        const step = a.steps[0];
        const text = (step && Array.isArray(answers[step.id]) ? (answers[step.id] as (string | null)[])[0] : '') ?? '';
        const { data } = await submitZhazylym({
          variables: { zhazylymId: a.id, studentId: profileId, data: { text: text.trim(), time: time.text + time.games } },
        });
        if (!data?.submitZhazylym) throw new Error('submitZhazylym returned nothing');
      } else if (a.kind === 'durys') {
        const { data } = await submitDurys({ variables: { durysAssignmentId: a.id, studentId: profileId } });
        if (!data?.submitDurysAssignment) throw new Error('submitDurysAssignment returned nothing');
      }
      sent.current.add(a.group);
    }
    router.replace(resultHref(kind, id));
    // School lists and home counters show the new submission.
    void client.refetchQueries({ include: 'active' }).catch(() => undefined);
  };
}

function Play({ kind, id, title, activities }: { kind: Kind; id: string; title: string; activities: Activity[] }) {
  const { t } = useTranslation();
  const submit = useSubmitActivities(kind, id);
  const steps = useMemo(() => activities.flatMap((a) => a.steps), [activities]);
  if (!steps.length) return <Redirect href={resultHref(kind, id)} />;
  return (
    <PlayerShell
      title={title}
      steps={steps}
      mode="play"
      words={flashcardWords(activities)}
      backLabel={t('player.back')}
      onSubmit={(answers, timing) => submit(activities, answers, timing)}
    />
  );
}

function AssignmentPlayer({ kind, id }: { kind: Kind; id: string }) {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const lang = useSession((s) => s.definitionLanguage);
  const { data, loading, error, refetch } = useQuery(PlayerAssignmentQuery, { variables: { id, studentId: profileId }, fetchPolicy: 'cache-and-network' });
  const a = data?.assignment;
  const activities = useMemo(() => (a ? [assignmentActivity(a, lang)] : []), [a, lang]);
  if (!data && loading) return <Loading />;
  if (error && !data) return <Failed onRetry={() => void refetch()} />;
  if (!a) return <Failed />;
  if (a.submission) return <Redirect href={resultHref(kind, id)} />;
  if (a.deadline && a.deadline < now()) return <FocusPage backLabel={t('player.back')}><Notice text={t('player.expired')} /></FocusPage>;
  return <Play kind={kind} id={id} title={a.name} activities={activities} />;
}

function ZhazylymPlayer({ id }: { id: string }) {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const { data, loading, error, refetch } = useQuery(PlayerZhazylymQuery, { variables: { id, studentId: profileId }, fetchPolicy: 'cache-and-network' });
  const z = data?.zhazylym;
  const activities = useMemo(() => (z ? [zhazylymActivity(z)] : []), [z]);
  if (!data && loading) return <Loading />;
  if (error && !data) return <Failed onRetry={() => void refetch()} />;
  if (!z) return <Failed />;
  if (z.submission) return <Redirect href={resultHref('zhazylym', id)} />;
  if (z.opensAt > now()) return <FocusPage backLabel={t('player.back')}><Notice text={t('player.notOpen')} /></FocusPage>;
  if (z.deadline && z.deadline < now()) return <FocusPage backLabel={t('player.back')}><Notice text={t('player.expired')} /></FocusPage>;
  return <Play kind="zhazylym" id={id} title={z.name} activities={activities} />;
}

function DurysPlayer({ id }: { id: string }) {
  const { profileId } = useProfile();
  const { data, loading, error, refetch } = useQuery(PlayerDurysQuery, { variables: { id, studentId: profileId }, fetchPolicy: 'cache-and-network' });
  const d = data?.durysAssignment;
  const activities = useMemo(() => (d ? [durysActivity(d)] : []), [d]);
  if (!data && loading) return <Loading />;
  if (error && !data) return <Failed onRetry={() => void refetch()} />;
  if (!d) return <Failed />;
  if (d.submission) return <Redirect href={resultHref('durys', id)} />;
  return <Play kind="durys" id={id} title={d.durysTitle.title} activities={activities} />;
}

/** Lessons need the class to reach each text's assignment. */
export function useStudentClassId() {
  const { profileId } = useProfile();
  const q = useQuery(PlayerStudentClassQuery, { variables: { studentId: profileId } });
  return { classId: q.data?.student?.class.id, loading: q.loading && !q.data, error: q.error, refetch: q.refetch };
}

function LessonPlayer({ id }: { id: string }) {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const lang = useSession((s) => s.definitionLanguage);
  const cls = useStudentClassId();
  const { data, loading, error, refetch } = useQuery(PlayerLessonQuery, {
    variables: { id, studentId: profileId, classId: cls.classId ?? '' },
    skip: !cls.classId,
    fetchPolicy: 'cache-and-network',
  });
  const lesson = data?.lesson;
  const activities = useMemo(() => (lesson ? lessonActivities(lesson, lang) : []), [lesson, lang]);
  if (cls.loading || (!data && loading)) return <Loading />;
  if (cls.error || (error && !data)) return <Failed onRetry={() => void (cls.error ? cls.refetch() : refetch())} />;
  if (!lesson) return <Failed />;
  if (lesson.opensAt > now()) return <FocusPage backLabel={t('player.back')}><Notice text={t('player.notOpen')} /></FocusPage>;
  return <Play kind="lesson" id={id} title={lesson.name} activities={activities} />;
}

/** /student/play/[kind]/[id]: one player for every kind of school work. */
export function PlayerScreen() {
  const params = useLocalSearchParams<{ kind: Kind; id: string; game?: string }>();
  const { kind, id } = params;
  switch (kind) {
    case 'oqylym':
    case 'tyndalym':
      return <AssignmentPlayer kind={kind} id={id} />;
    case 'zhazylym':
      return <ZhazylymPlayer id={id} />;
    case 'durys':
      return <DurysPlayer id={id} />;
    case 'lesson':
      return <LessonPlayer id={id} />;
    case 'oyna':
      return <OynaPlayer id={id} params={params} />;
    default:
      return <Failed />;
  }
}
