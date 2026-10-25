import { skipToken, useMutation, useSuspenseQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { StudentAvatar } from '@/features/classes/class-avatar';
import {
  reviewNavigation,
  type Attempt,
  type ReviewKind,
  type Work,
} from '@/features/classes/class-data';
import {
  REVIEW_ASSIGNMENT_SUBMISSION,
  REVIEW_GRADE_MINI_STORY,
  REVIEW_GRADE_ZHAZYLYM,
  REVIEW_MINI_STORY_SUBMISSION,
  REVIEW_ZHAZYLYM_SUBMISSION,
} from '@/features/review/gql';
import { submissionHref } from '@/features/review/routes';
import { parseScore } from '@/features/review/score';
import { findWork, useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { ChoiceRow, Dialog } from '@/ui/dialog';
import { EmptyState, NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

const REVIEW_KINDS: ReviewKind[] = [
  'assignment',
  'zhazylym',
  'miniStory',
  'wordle',
  'quizlet',
  'wordGame',
];

function Disclosure({
  label,
  tone = 'muted',
  children,
}: {
  label: string;
  tone?: 'muted' | 'link';
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        className="press h-11 flex-row items-center justify-between gap-3"
      >
        <Text
          className={
            tone === 'link'
              ? 'font-body text-[13px] leading-[19.5px] text-link'
              : 'font-body-semibold text-[12px] leading-[19px] text-[#91a2b9]'
          }
        >
          {label}
        </Text>
        <Icon name="down" size={tone === 'link' ? 16 : 15} color={colors.ink} />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function WrittenAnswer({
  question,
  answer,
  image,
}: {
  question: string;
  answer: string | null | undefined;
  image?: string;
}) {
  const { t } = useTranslation();
  const content = useContentText();
  return (
    <View>
      <Text className="mb-[7px] font-body text-[11px] leading-[16px] text-[#98a5b8]">
        {t('review.question')}
      </Text>
      <Text className="mb-[14px] font-body text-[14px] leading-[22px] text-[#485469]">
        {content(question)}
      </Text>
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 14, marginBottom: 14 }}
          contentFit="cover"
        />
      ) : null}
      <View className="mb-4 rounded-[14px] bg-[#f4f8fd] p-4">
        <Text className="font-reading text-[16px] leading-[26px] text-[#303c50]">
          {answer?.trim() ? content(answer) : t('review.notSubmitted')}
        </Text>
      </View>
    </View>
  );
}

function ScoreCard({ score }: { score: number | null }) {
  const { t } = useTranslation();
  return (
    <View className="rounded-[14px] bg-[#f4f8fe] p-4">
      <Text className="font-body text-[11px] leading-[16.5px] text-[#9aacbf]">
        {t('review.result')}
      </Text>
      <Text className="mt-1 font-body-medium text-[23px] leading-[29px] text-[#6c99d8]">
        {score == null ? '—' : `${score}%`}
      </Text>
      <Text className="mt-1 font-body text-[11px] leading-[16px] text-hint">
        {t('review.autoChecked')}
      </Text>
    </View>
  );
}

/** Answer area for each submission kind; returns the current points for gradable kinds. */
function useSubmissionContent(kind: ReviewKind, id: string) {
  const queryKey = useRetryKey();
  const zhazylym = useSuspenseQuery(REVIEW_ZHAZYLYM_SUBMISSION, kind === 'zhazylym' ? { variables: { id }, queryKey } : skipToken);
  const story = useSuspenseQuery(REVIEW_MINI_STORY_SUBMISSION, kind === 'miniStory' ? { variables: { id }, queryKey } : skipToken);
  const assignment = useSuspenseQuery(REVIEW_ASSIGNMENT_SUBMISSION, kind === 'assignment' ? { variables: { id }, queryKey } : skipToken);
  return {
    zhazylym: zhazylym.data?.zhazylymSubmission,
    story: story.data?.miniStorySubmission,
    assignment: assignment.data?.submission,
  };
}

function Answers({
  kind,
  data,
  attempt,
}: {
  kind: ReviewKind;
  data: ReturnType<typeof useSubmissionContent>;
  attempt: Attempt;
}) {
  const { t } = useTranslation();
  const content = useContentText();
  if (kind === 'zhazylym' && data.zhazylym) {
    const a = data.zhazylym.assignment;
    const images =
      a.__typename === 'ImageZhazylym' ? a.imagesDownload.filter((x): x is string => !!x) : [];
    const words = 'words' in a ? a.words : [];
    const question = images.length
      ? t('review.writeFromImages')
      : t('review.writeWithWords', { words: words.join(', ') });
    return <WrittenAnswer question={question} answer={data.zhazylym.text} image={images[0]} />;
  }
  if (kind === 'miniStory' && data.story) {
    return (
      <WrittenAnswer
        question={t('review.miniStoryPrompt', { words: data.story.game.words.join(', ') })}
        answer={data.story.text}
      />
    );
  }
  if (kind === 'assignment' && data.assignment) {
    const s = data.assignment;
    const open = s.freeResponse?.questions ?? [];
    const quiz = [
      ...(s.multipleChoice?.questions ?? []).map((q) => ({
        type: t('classes.content.mcq'),
        question: q.question.question,
        answer: q.answer ?? '—',
      })),
      ...(s.trueFalse?.questions ?? []).map((q) => ({
        type: t('classes.content.tf'),
        question: q.question.question,
        answer: q.answer == null ? '—' : t(q.answer ? 'review.true' : 'review.false'),
      })),
    ];
    return (
      <View>
        {open.length ? (
          open.map((q, i) => (
            <WrittenAnswer key={i} question={q.question.question} answer={q.answer} />
          ))
        ) : (
          <Text className="mb-2 font-body text-[11px] leading-[16px] text-[#98a5b8]">
            {t('review.noWritten')}
          </Text>
        )}
        {quiz.length ? (
          <View className="my-4">
            <Disclosure label={t('review.quizAnswers')}>
              {quiz.map((q, i) => (
                <View key={i} className="py-[14px]">
                  <Text className="font-body text-[11px] leading-[16px] text-subtle">{q.type}</Text>
                  <Text className="mb-2 mt-1.5 font-body-semibold text-[14px] leading-[22px]">
                    {content(q.question)}
                  </Text>
                  <Text className="font-body text-[14px] leading-[22px] text-[#485970]">
                    {content(q.answer)}
                  </Text>
                </View>
              ))}
            </Disclosure>
          </View>
        ) : null}
      </View>
    );
  }
  if (kind === 'wordle' || kind === 'quizlet' || kind === 'wordGame')
    return <ScoreCard score={attempt.score} />;
  return <EmptyState title={t('review.notFound')} />;
}

function Review({
  work,
  attempt,
  kind,
  studentName,
}: {
  work: Work;
  attempt: Attempt;
  kind: ReviewKind;
  studentName: string;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const content = useContentText();
  const data = useSubmissionContent(kind, attempt.id);
  const nav = reviewNavigation(work, attempt.id);
  const names = useStudentNames(work);
  const [pickerOpen, setPickerOpen] = useState(false);
  const gradable = kind === 'zhazylym' || kind === 'miniStory';
  const points = kind === 'zhazylym' ? data.zhazylym?.points : data.story?.points;
  const [input, setInput] = useState<string | null>(null);
  const value = input ?? (points == null ? '' : String(points));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [gradeZhazylym, zState] = useMutation(REVIEW_GRADE_ZHAZYLYM);
  const [gradeStory, sState] = useMutation(REVIEW_GRADE_MINI_STORY);
  const saving = zState.loading || sState.loading;
  const hasOpenQuestions = !!data.assignment?.freeResponse?.questions.length;

  const go = (target: Attempt | undefined) =>
    target && router.replace(submissionHref(target, work.key));

  const save = async (next: boolean) => {
    const score = parseScore(value);
    if (score == null) return setError(t('review.scoreRange'));
    setError(null);
    const variables = { id: attempt.id, points: score };
    const result = await (
      kind === 'zhazylym' ? gradeZhazylym({ variables }) : gradeStory({ variables })
    ).catch(() => null);
    if (!result?.data) return setError(t('review.saveFailed'));
    if (next && nav.nextPending) go(nav.nextPending);
    else setSaved(true);
  };

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        <Text className="mb-2 font-body-semibold text-[26px] leading-[31.2px]">
          {content(work.name)}
        </Text>
        <View className="mb-6 flex-row items-center gap-2">
          <StudentAvatar name={studentName} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('review.student')}
            onPress={() => setPickerOpen(true)}
            className="press flex-1"
          >
            <Text className="font-body-semibold text-[12px] leading-[18px]" numberOfLines={1}>
              {studentName}
            </Text>
            <Text
              className="mt-0.5 font-body text-[10px] leading-[15px] text-[#94a2b6]"
              numberOfLines={1}
            >
              {work.className} ·{' '}
              {t(attempt.pending ? 'review.pendingState' : 'review.reviewedState')}
            </Text>
          </Pressable>
          <Text className="font-body text-[10px] leading-[16px] text-[#a4afbf]">
            {nav.index + 1}/{nav.list.length}
          </Text>
          {(
            [
              [nav.previous, 'back', 'review.previousStudent'],
              [nav.next, 'arrow', 'review.nextStudent'],
            ] as const
          ).map(([target, icon, label]) => (
            <Pressable
              key={icon}
              accessibilityRole="button"
              accessibilityLabel={t(label)}
              disabled={!target}
              onPress={() => go(target)}
              hitSlop={{ top: 6, bottom: 6 }}
              className="h-8 w-11 items-center justify-center rounded-[9px] bg-[#f3f7fc] active:opacity-80"
            >
              <Icon name={icon} size={15} color={target ? colors.ink : '#c4ccd8'} />
            </Pressable>
          ))}
        </View>

        <Answers kind={kind} data={data} attempt={attempt} />

        {gradable ? (
          <View className="pt-5">
            <Text className="mb-3 font-body-semibold text-[17px] leading-[24px]">
              {t('review.giveScore')}
            </Text>
            <View className="mb-[18px] flex-row items-center justify-between gap-4">
              <Text className="font-body-medium text-[12px] leading-[20px] text-subtle">
                {t('review.score')}
              </Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={value}
                  onChangeText={(text) => (
                    setInput(text.replace(/\D/g, '').slice(0, 2)),
                    setSaved(false)
                  )}
                  keyboardType="number-pad"
                  accessibilityLabel={t('review.score')}
                  maxLength={2}
                  className="h-11 w-[74px] rounded-[11px] bg-[#f4f7fc] px-3 text-center font-body text-[16px] text-ink"
                />
                <Text className="font-body text-[13px] leading-[19.5px] text-[#a2aec0]">
                  {t('review.outOf')}
                </Text>
              </View>
            </View>
            {error ? (
              <Text className="mb-3 font-body text-[12px] text-danger" accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <Disclosure label={t('review.addComment')} tone="link">
              <NotReady body={t('review.commentNotReady')} className="mb-3" />
            </Disclosure>
          </View>
        ) : kind === 'assignment' ? (
          <View className="gap-3 pt-5">
            <ScoreCard score={attempt.score} />
            {hasOpenQuestions ? <NotReady body={t('review.frqNotReady')} /> : null}
          </View>
        ) : null}
      </ScrollView>

      {gradable ? (
        <View
          className="flex-row items-center gap-2.5 bg-white/95 px-5 pt-3"
          style={{
            paddingBottom: insets.bottom + 18,
            boxShadow: '0 -4px 16px rgba(36,38,49,0.016)',
          }}
        >
          {nav.nextPending ? (
            <Button
              variant="soft"
              label={t('review.save')}
              disabled={saving}
              onPress={() => void save(false)}
              className="h-[46px] w-[92px] bg-[#f3f7ff] px-2.5"
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void save(!!nav.nextPending)}
            className="h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-control bg-primary-strong px-2.5 active:opacity-90 disabled:opacity-60"
          >
            {saved && !nav.nextPending ? (
              <Icon name="check" size={18} color={colors.white} />
            ) : null}
            <Text className="font-body-semibold text-[12px] leading-[18px] text-white">
              {nav.nextPending
                ? t('review.saveNext')
                : saved
                  ? t('review.saved')
                  : t('review.save')}
            </Text>
            {nav.nextPending ? <Icon name="arrow" size={18} color={colors.white} /> : null}
          </Pressable>
        </View>
      ) : null}

      <Dialog visible={pickerOpen} title={t('review.student')} onClose={() => setPickerOpen(false)}>
        <View className="gap-[7px]">
          {nav.list.map((a, i) => (
            <ChoiceRow
              key={a.id}
              label={`${i + 1}. ${names.get(a.studentId) ?? ''}`}
              selected={a.id === attempt.id}
              onPress={() => {
                setPickerOpen(false);
                if (a.id !== attempt.id) go(a);
              }}
            />
          ))}
        </View>
      </Dialog>
    </>
  );
}

function useStudentNames(work: Work) {
  const school = useTeacherSchool();
  return new Map(
    school.classes.find((c) => c.id === work.classId)?.students.map((s) => [s.id, s.name]) ?? [],
  );
}

/** Teacher reviews one submission: the answer, quiz answers, a 0..10 score, then save or save & next. */
export function SubmissionScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('classes.school')} />
      <QueryBoundary
        fallback={
          <View className="gap-3 px-5 pt-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-10" />
            <Skeleton className="h-40" />
          </View>
        }
      >
        <Submission />
      </QueryBoundary>
    </View>
  );
}

function Submission() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; kind?: string; work?: string }>();
  const school = useTeacherSchool();
  const found = params.work ? findWork(school.classes, params.work) : null;
  const attempt = found?.work.attempts.find((a) => a.id === params.id);
  const kind = REVIEW_KINDS.includes(params.kind as ReviewKind)
    ? (params.kind as ReviewKind)
    : attempt?.reviewKind;

  if (!found || !attempt || !kind) return <EmptyState title={t('review.notFound')} />;
  const studentName = found.classWork.students.find((s) => s.id === attempt.studentId)?.name ?? '';
  return (
    <Review
      key={attempt.id}
      work={found.work}
      attempt={attempt}
      kind={kind}
      studentName={studentName}
    />
  );
}
