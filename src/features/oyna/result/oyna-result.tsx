import { useSuspenseQuery } from '@apollo/client/react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { OYNA_MINI_STORY_RESULT, OYNA_QUIZLET_RESULT, OYNA_WORDLE_RESULT, OYNA_WORD_GAME_RESULT } from '@/features/oyna/gql';
import { formatClock, type OynaKind } from '@/features/oyna/logic/game-type';
import { PlayerActions, leavePlayer } from '@/features/oyna/player-frame';
import { PlayerError, PlayerLoading } from '@/features/oyna/player-states';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { gradient } from '@/ui/gradient';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

import { Leaderboard, MiniStoryDetails, QuizletDetails, WordGameDetails, WordleDetails } from './details';

export type ResultSummary = {
  name: string;
  /** null while the teacher has not graded it (mini story) or the API gave no points. */
  points: number | null;
  maxPoints: number | null;
  time: number | null;
};

const percent = (points: number, max: number) => Math.min(100, Math.max(0, Math.round((points / max) * 100)));

/** Score card: green with the score, or the blue "waiting for the teacher" state (student-results-open-result). */
function ResultState({ points, maxPoints }: Pick<ResultSummary, 'points' | 'maxPoints'>) {
  const { t } = useTranslation();
  if (points == null) {
    return (
      <View className="mb-6 items-center gap-[5px] rounded-sheet bg-[#f0f6ff] px-[18px] pb-[26px] pt-6">
        <View className="mb-2.5 h-[38px] w-[38px] items-center justify-center rounded-full bg-[#e0edff]">
          <Icon name="solid-book" size={20} color="#1877f2" />
        </View>
        <Text className="text-center font-body-semibold text-[17px] leading-[23px] text-[#354b69]">{t('oyna.result.pendingTitle')}</Text>
        <Text className="max-w-[240px] text-center font-body text-[12px] leading-[19px] text-[#7e8da3]">{t('oyna.result.pendingBody')}</Text>
      </View>
    );
  }
  const asPercent = maxPoints != null && maxPoints > 0;
  return (
    <View
      className="mb-6 items-center gap-[5px] rounded-sheet px-[18px] pb-[26px] pt-6"
      style={[gradient('result'), { backgroundColor: '#20996d' }]}
    >
      <View className="mb-2.5 h-[38px] w-[38px] items-center justify-center rounded-full bg-white/15">
        <Icon name="check" size={20} color={colors.white} />
      </View>
      <Text className="font-body-semibold text-[54px] leading-[62px] tracking-[-2px] text-white">
        {asPercent ? percent(points, maxPoints) : points}
        <Text className="font-body-semibold text-[24px] tracking-normal text-white">{asPercent ? '%' : ` ${t('oyna.result.points')}`}</Text>
      </Text>
      <Text className="font-body text-[12px] leading-[16px] text-white/85">{t('oyna.result.score')}</Text>
    </View>
  );
}

function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View className="mb-4 flex-row gap-5 rounded-2xl bg-[#f6f8fc] p-4">
      {items.map((i) => (
        <View key={i.label} className="flex-1">
          <Text className="mb-1 font-body text-[11px] leading-[16px] text-subtle">{i.label}</Text>
          <Text className="font-body-medium text-[14px] leading-[21px]">{i.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function ResultLayout({ summary, backLabel, children }: { summary: ResultSummary; backLabel?: string; children?: ReactNode }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center bg-surface px-5 pb-2.5" style={{ paddingTop: insets.top > 0 ? insets.top : 38 }}>
        <Pressable accessibilityRole="button" onPress={leavePlayer} hitSlop={6} className="h-11 flex-row items-center gap-1.5 rounded-[24px] pl-2 pr-3 active:bg-canvas">
          <Icon name="back" size={20} color={colors.ink} />
          <Text className="font-body-medium text-[12px] leading-[18px] text-body">{backLabel ?? t('oyna.result.back')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 + insets.bottom }}>
        <Text variant="display" className="mb-5 text-[25px] leading-[31px]">{t('oyna.result.title')}</Text>
        <ResultState points={summary.points} maxPoints={summary.maxPoints} />
        <Text className="mb-3.5 font-body-semibold text-[17px] leading-[24px]">{ct(summary.name)}</Text>
        <Facts
          items={[
            { label: t('oyna.result.time'), value: summary.time != null ? formatClock(summary.time) : '—' },
            { label: t('oyna.result.attempt'), value: '1' },
          ]}
        />
        {children}
      </ScrollView>
      <View className="absolute inset-x-0 bottom-0 flex-row bg-white/95 px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <PlayerActions label={t('oyna.result.returnSchool')} onPress={leavePlayer} />
      </View>
    </View>
  );
}

function NotSubmitted({ name, backLabel }: { name: string; backLabel?: string }) {
  const { t } = useTranslation();
  return (
    <ResultLayout summary={{ name, points: null, maxPoints: null, time: null }} backLabel={backLabel}>
      <Text className="font-body text-[14px] leading-[21px] text-muted">{t('oyna.result.notSubmitted')}</Text>
    </ResultLayout>
  );
}

function WordGameResult({ id, backLabel }: { id: string; backLabel?: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_WORD_GAME_RESULT, { variables: { id, studentId: profileId }, fetchPolicy: 'network-only', queryKey });
  const game = data.wordGameGame;
  if (!game) return <PlayerError />;
  const sub = game.submission;
  if (!sub) return <NotSubmitted name={game.name} backLabel={backLabel} />;
  return (
    <ResultLayout summary={{ name: game.name || (game.topicName ?? ''), points: sub.points ?? null, maxPoints: game.maxPoints, time: sub.time }} backLabel={backLabel}>
      <WordGameDetails submission={sub} />
    </ResultLayout>
  );
}

function WordleResult({ id, backLabel }: { id: string; backLabel?: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_WORDLE_RESULT, { variables: { id, studentId: profileId }, fetchPolicy: 'network-only', queryKey });
  const game = data.wordleGame;
  if (!game) return <PlayerError />;
  const sub = game.submission;
  if (!sub) return <NotSubmitted name={game.name} backLabel={backLabel} />;
  return (
    <ResultLayout summary={{ name: game.name, points: sub.points, maxPoints: game.maxPoints, time: sub.time }} backLabel={backLabel}>
      <WordleDetails words={game.words} guesses={sub.guesses} />
      <Leaderboard rows={game.submissions.map((s) => ({ id: s.student.id, name: s.student.name, points: s.points, time: s.time }))} me={profileId} />
    </ResultLayout>
  );
}

function QuizletResult({ id, backLabel }: { id: string; backLabel?: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_QUIZLET_RESULT, { variables: { id, studentId: profileId }, fetchPolicy: 'network-only', queryKey });
  const game = data.quizletGame;
  if (!game) return <PlayerError />;
  const sub = game.submission;
  if (!sub) return <NotSubmitted name={game.name} backLabel={backLabel} />;
  return (
    <ResultLayout summary={{ name: game.name, points: sub.points, maxPoints: game.maxPoints, time: sub.time }} backLabel={backLabel}>
      <QuizletDetails boards={game.boards} guessed={sub.guessed} />
      <Leaderboard rows={game.submissions.map((s) => ({ id: s.student.id, name: s.student.name, points: s.points, time: s.time }))} me={profileId} />
    </ResultLayout>
  );
}

function MiniStoryResult({ id, backLabel }: { id: string; backLabel?: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_MINI_STORY_RESULT, { variables: { id, studentId: profileId }, fetchPolicy: 'network-only', queryKey });
  const game = data.miniStoryGame;
  if (!game) return <PlayerError />;
  const sub = game.submission;
  if (!sub) return <NotSubmitted name={game.name} backLabel={backLabel} />;
  return (
    <ResultLayout summary={{ name: game.name, points: sub.points ?? null, maxPoints: game.maxPoints, time: sub.time }} backLabel={backLabel}>
      <MiniStoryDetails words={game.words} text={sub.text} />
    </ResultLayout>
  );
}

/** The student's own result for one Oyna game, with the per-game review and (wordle, quizlet) the class leaderboard. */
export function OynaResultView({ kind, id, backLabel }: { kind: OynaKind; id: string; backLabel?: string }) {
  return (
    <QueryBoundary fallback={<PlayerLoading />} errorFallback={(retry) => <PlayerError onRetry={retry} />}>
      <GameResult kind={kind} id={id} backLabel={backLabel} />
    </QueryBoundary>
  );
}

function GameResult({ kind, id, backLabel }: { kind: OynaKind; id: string; backLabel?: string }) {
  switch (kind) {
    case 'wordgame':
      return <WordGameResult id={id} backLabel={backLabel} />;
    case 'wordle':
      return <WordleResult id={id} backLabel={backLabel} />;
    case 'quizlet':
      return <QuizletResult id={id} backLabel={backLabel} />;
    case 'ministory':
      return <MiniStoryResult id={id} backLabel={backLabel} />;
  }
}
