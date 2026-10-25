import { skipToken, useSuspenseQuery } from '@apollo/client/react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useProfile, useSession } from '@/features/auth/session';
import { OynaResult } from '@/features/oyna/oyna-player';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { ErrorState, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

import { RESULT_ASSIGNMENT, RESULT_DURYS, RESULT_LESSON, RESULT_ZHAZYLYM } from './gql';
import { assignmentOutcome, lessonOutcome, zhazylymOutcome, type Outcome } from './modules/outcome';
import { FocusHeader, leave } from './parts';
import { FocusPage, Notice, useStudentClassId } from './player-screen';
import { PlayerShell } from './player-shell';

type Kind = 'oqylym' | 'tyndalym' | 'durys' | 'oyna' | 'lesson' | 'zhazylym';

const date = (secs: number) => {
  const d = new Date(secs * 1000);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const playHref = (kind: Kind, id: string): Href => ({ pathname: '/student/play/[kind]/[id]', params: { kind, id } });

// ---------- view ----------

function StateCard({ outcome }: { outcome: Outcome }) {
  const { t } = useTranslation();
  if (outcome.pending) {
    return (
      <View className="mb-6 items-center gap-[5px] rounded-sheet bg-[#f0f6ff] px-[18px] pb-[26px] pt-6">
        <View className="mb-[5px] h-[38px] w-[38px] items-center justify-center rounded-full bg-[#e0edff]">
          <Icon name="solid-book" size={20} color="#1877f2" />
        </View>
        <Text className="font-body-semibold text-[17px] leading-[23px] text-[#354b69]">{t('player.result.sentTitle')}</Text>
        <Text className="max-w-[240px] text-center font-body text-[12px] leading-[19px] text-[#7e8da3]">{t('player.result.sentBody')}</Text>
      </View>
    );
  }
  return (
    <View
      className="mb-6 items-center gap-[5px] overflow-hidden rounded-sheet bg-success px-[18px] pb-[26px] pt-6"
      style={{ experimental_backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.14), transparent 65%)' }}
    >
      <View className="mb-[5px] h-[38px] w-[38px] items-center justify-center rounded-full bg-white/15">
        <Icon name="check" size={20} color={colors.white} />
      </View>
      {outcome.score != null ? (
        <>
          <Text className="font-body-semibold text-[54px] leading-[62px] tracking-[-2px] text-white">
            {outcome.score}
            <Text className="font-body-semibold text-[24px] tracking-normal text-white">%</Text>
          </Text>
          <Text className="font-body text-[12px] text-white/85">{t('player.result.score')}</Text>
        </>
      ) : (
        <>
          <Text className="font-body-semibold text-[17px] leading-[23px] text-white">{t('player.result.doneTitle')}</Text>
          <Text className="max-w-[240px] text-center font-body text-[12px] leading-[19px] text-white/85">{t('player.result.doneBody')}</Text>
        </>
      )}
    </View>
  );
}

function ResultView({ kind, id, outcome }: { kind: Kind; id: string; outcome: Outcome }) {
  const { t } = useTranslation();
  const content = useContentText();
  const insets = useSafeAreaInsets();
  const [reviewing, setReviewing] = useState(false);

  if (reviewing && outcome.review) {
    return (
      <PlayerShell
        title={outcome.title}
        steps={outcome.review.steps}
        initialAnswers={outcome.review.answers}
        mode="review"
        backLabel={t('player.result.title')}
        onBack={() => setReviewing(false)}
        onFinish={() => setReviewing(false)}
        finishLabel={t('common.actions.close')}
      />
    );
  }

  const toSchool = () => router.dismissTo('/student/school');

  return (
    <View className="flex-1 bg-surface">
      <FocusHeader label={t('player.backResults')} onBack={leave} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 + insets.bottom }}>
        <Text variant="display" className="mb-5 text-[25px] leading-[31px]">{t('player.result.title')}</Text>
        {!outcome.submitted ? (
          <>
            <Notice text={t('player.result.notSubmitted')} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace(playHref(kind, id))}
              className="h-[43px] items-center justify-center rounded-control bg-[#f3f7ff] active:opacity-80"
            >
              <Text className="font-body-semibold text-[13px] leading-[18px] text-link">{t('player.result.start')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <StateCard outcome={outcome} />
            <Text className="mb-[14px] font-body-semibold text-[17px] leading-[24px] text-ink">{content(outcome.title)}</Text>
            <View className="mb-4 flex-row gap-5 rounded-[16px] bg-canvas p-4">
              {outcome.submittedAt ? (
                <View className="flex-1">
                  <Text className="mb-1 font-body text-[11px] leading-[16px] text-subtle">{t('player.result.submittedAt')}</Text>
                  <Text className="font-body-medium text-[14px] leading-[21px] text-ink">{date(outcome.submittedAt)}</Text>
                </View>
              ) : null}
              {/* The API keeps one submission per work (no attempt count), so a result is always the first attempt. */}
              <View className="flex-1">
                <Text className="mb-1 font-body text-[11px] leading-[16px] text-subtle">{t('player.result.attempt')}</Text>
                <Text className="font-body-medium text-[14px] leading-[21px] text-ink">1</Text>
              </View>
            </View>
            {outcome.review ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setReviewing(true)}
                className="h-[43px] items-center justify-center rounded-control bg-[#f3f7ff] active:opacity-80"
              >
                <Text className="font-body-semibold text-[13px] leading-[18px] text-link">{t('player.result.reviewAnswers')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
      <View className="absolute inset-x-0 bottom-0 bg-white/95 px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          accessibilityRole="button"
          onPress={toSchool}
          className="h-[46px] items-center justify-center rounded-control bg-attention px-[13px] active:opacity-90"
        >
          <Text className="font-body-semibold text-[13px] leading-[18px] text-white">{t('player.result.backToSchool')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Loading() {
  const { t } = useTranslation();
  return (
    <FocusPage backLabel={t('player.backResults')}>
      <Skeleton className="mb-5 h-8 w-1/3" />
      <Skeleton className="mb-6 h-40 rounded-sheet" />
      <Skeleton className="mb-4 h-6 w-2/3" />
      <Skeleton className="h-20" />
    </FocusPage>
  );
}

/** Load errors (with retry), or work the API does not return (deleted, or not this student's). */
function Failed({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <FocusPage backLabel={t('player.backResults')}>
      <ErrorState onRetry={onRetry} />
    </FocusPage>
  );
}

function AssignmentResult({ kind, id }: { kind: Kind; id: string }) {
  const { profileId } = useProfile();
  const lang = useSession((s) => s.definitionLanguage);
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RESULT_ASSIGNMENT, { variables: { id, studentId: profileId }, queryKey });
  const outcome = useMemo(() => (data.assignment ? assignmentOutcome(data.assignment, lang) : null), [data, lang]);
  if (!outcome) return <Failed />;
  return <ResultView kind={kind} id={id} outcome={outcome} />;
}

function ZhazylymResult({ id }: { id: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RESULT_ZHAZYLYM, { variables: { id, studentId: profileId }, queryKey });
  const outcome = useMemo(() => (data.zhazylym ? zhazylymOutcome(data.zhazylym) : null), [data]);
  if (!outcome) return <Failed />;
  return <ResultView kind="zhazylym" id={id} outcome={outcome} />;
}

function DurysResult({ id }: { id: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RESULT_DURYS, { variables: { id, studentId: profileId }, queryKey });
  const d = data.durysAssignment;
  if (!d) return <Failed />;
  // Durys only records that the story was finished: no score, no stored answers.
  const outcome: Outcome = { title: d.durysTitle.title, submitted: d.submission, submittedAt: null, score: null, pending: false, review: null };
  return <ResultView kind="durys" id={id} outcome={outcome} />;
}

function LessonResult({ id }: { id: string }) {
  const { profileId } = useProfile();
  const lang = useSession((s) => s.definitionLanguage);
  const classId = useStudentClassId();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RESULT_LESSON, classId ? { variables: { id, studentId: profileId, classId }, queryKey } : skipToken);
  const outcome = useMemo(() => (data?.lesson ? lessonOutcome(data.lesson, lang) : null), [data, lang]);
  if (!outcome) return <Failed />;
  return <ResultView kind="lesson" id={id} outcome={outcome} />;
}

/** /student/result/[kind]/[id]: the student's result for one piece of school work. */
export function ResultScreen() {
  const params = useLocalSearchParams<{ kind: Kind; id: string; game?: string }>();
  const { kind, id } = params;
  // Each kind keeps its own query; the boundary shows the result skeleton while it loads.
  const load = (result: ReactNode) => <QueryBoundary fallback={<Loading />} errorFallback={(retry) => <Failed onRetry={retry} />}>{result}</QueryBoundary>;
  switch (kind) {
    case 'oqylym':
    case 'tyndalym':
      return load(<AssignmentResult kind={kind} id={id} />);
    case 'zhazylym':
      return load(<ZhazylymResult id={id} />);
    case 'durys':
      return load(<DurysResult id={id} />);
    case 'lesson':
      return load(<LessonResult id={id} />);
    case 'oyna':
      return <OynaResult id={id} params={params} />;
    default:
      return <Failed />;
  }
}

