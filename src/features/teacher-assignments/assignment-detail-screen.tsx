import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session';
import { StudentAvatar } from '@/features/classes/class-avatar';
import { workNumbers, type Work } from '@/features/classes/class-data';
import { shortDate } from '@/features/classes/format';
import { ProgressLine } from '@/features/classes/progress-line';
import { submissionHref } from '@/features/review/routes';
import { useSchoolFilters } from '@/features/teacher-assignments/filters';
import {
  TEACHER_ASSIGNMENT_CONTENT,
  TEACHER_DELETE_ASSIGNMENT,
  TEACHER_DELETE_DURYS,
  TEACHER_DELETE_LESSON,
  TEACHER_DELETE_MINI_STORY,
  TEACHER_DELETE_QUIZLET,
  TEACHER_DELETE_WORD_GAME,
  TEACHER_DELETE_WORDLE,
  TEACHER_DELETE_ZHAZYLYM,
  TEACHER_UPDATE_ASSIGNMENT_VISIBILITY,
  TEACHER_UPDATE_LESSON_VISIBILITY,
} from '@/features/teacher-assignments/gql';
import { contentKeysFromGames } from '@/features/teacher-assignments/content-keys';
import { EditWorkDialog } from '@/features/teacher-assignments/edit-work-dialog';
import { findWork, useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { evictEntity } from '@/lib/cache';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { Dialog } from '@/ui/dialog';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { Icon, type IconName } from '@/ui/icon';
import { StatusMark } from '@/ui/status-mark';
import { Text } from '@/ui/text';

function Disclosure({ label, count, defaultOpen = false, children }: { label: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        className="h-[52px] flex-row items-center gap-[9px]"
      >
        <Text className="flex-1 font-body text-[13px] leading-[19.5px] text-[#7b8faa]">{label}</Text>
        {count != null ? <Text className="font-body text-[11px] leading-[16px] text-[#a3b2c8]">{count}</Text> : null}
        <Icon name="down" size={15} color={colors.ink} />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function SoftAction({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="h-[42px] flex-1 flex-row items-center justify-center gap-2 rounded-[11px] bg-[#f3f7ff] active:opacity-80 disabled:opacity-50"
    >
      <Icon name={icon} size={18} color={colors.link} />
      <Text className="font-body-semibold text-[12px] leading-[18px] text-link">{label}</Text>
    </Pressable>
  );
}

/** Exercises of reading / listening works come from their own small query; other kinds know theirs already. */
function useContents(work: Work | undefined) {
  const textual = work?.kind === 'oqylym' || work?.kind === 'tyndalym';
  const { data } = useQuery(TEACHER_ASSIGNMENT_CONTENT, { variables: { id: work?.id ?? '' }, skip: !textual });
  if (!work) return { keys: [] as string[], textId: undefined };
  if (!textual) return { keys: work.contents ?? [], textId: undefined };
  const a = data?.assignment;
  return { keys: a ? contentKeysFromGames(work.kind as 'oqylym' | 'tyndalym', a) : [work.kind === 'tyndalym' ? 'listening' : 'reading'], textId: a?.text.id };
}

const DELETE = {
  OqylymAssignment: TEACHER_DELETE_ASSIGNMENT,
  TyndalymAssignment: TEACHER_DELETE_ASSIGNMENT,
  WordZhazylym: TEACHER_DELETE_ZHAZYLYM,
  ImageZhazylym: TEACHER_DELETE_ZHAZYLYM,
  DurysAssignment: TEACHER_DELETE_DURYS,
  Lesson: TEACHER_DELETE_LESSON,
  OynaGameMiniStory: TEACHER_DELETE_MINI_STORY,
  OynaGameWordle: TEACHER_DELETE_WORDLE,
  OynaGameQuizlet: TEACHER_DELETE_QUIZLET,
  OynaGameWordGame: TEACHER_DELETE_WORD_GAME,
} as const;

/** Teacher's view of one work: status, completion, content, per-student state and management. */
export function AssignmentDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const language = useSession((s) => s.uiLanguage);
  const content = useContentText();
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const school = useTeacherSchool();
  const found = findWork(school.classes, `${kind}:${id}`);
  const work = found?.work;
  const { keys, textId } = useContents(work);
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const [setAssignmentVisible, assignmentVisibility] = useMutation(TEACHER_UPDATE_ASSIGNMENT_VISIBILITY);
  const [setLessonVisible, lessonVisibility] = useMutation(TEACHER_UPDATE_LESSON_VISIBILITY);
  const client = useApolloClient();
  const [remove, removal] = useMutation(DELETE[(work?.typename ?? 'OqylymAssignment') as keyof typeof DELETE]);

  if (school.loading) {
    return (
      <View className="flex-1 bg-surface">
        <BackBar label={t('classes.school')} />
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-11" />
          <Skeleton className="h-20" />
        </View>
      </View>
    );
  }
  if (!work || !found) {
    return (
      <View className="flex-1 bg-surface">
        <BackBar label={t('classes.school')} />
        {school.error ? <ErrorState onRetry={() => void school.refetch()} /> : <EmptyState title={t('teacherAssignments.notFound')} />}
      </View>
    );
  }

  const n = workNumbers(work);
  const names = new Map(found.classWork.students.map((s) => [s.id, s.name]));
  const attempts = new Map(work.attempts.map((a) => [a.studentId, a]));
  const previewHref: Href | null =
    textId && (work.kind === 'oqylym' || work.kind === 'tyndalym')
      ? ({ pathname: '/teacher/material/[id]', params: { id: `${work.kind}:${textId}` } })
      : work.durysTitleId
        ? ({ pathname: '/teacher/material/[id]', params: { id: `grammar:${work.durysTitleId}` } })
        : null;
  const canToggle = work.kind === 'oqylym' || work.kind === 'tyndalym' || work.kind === 'lesson';
  const visible = work.status !== 'draft';
  const toggling = assignmentVisibility.loading || lessonVisibility.loading;

  const toggleVisibility = () => {
    if (work.kind === 'lesson') {
      // updateLesson answers a Boolean, so the new value is written into the cached lesson by hand.
      void setLessonVisible({
        variables: { id: work.id, visible: !visible },
        optimisticResponse: { updateLesson: true },
        update: (cache, { data }) => {
          if (!data?.updateLesson) return;
          cache.modify({ id: cache.identify({ __typename: 'Lesson', id: work.id }), fields: { visible: () => !visible } });
        },
      });
    } else {
      void setAssignmentVisible({
        variables: { id: work.id, visible: !visible },
        optimisticResponse: { updateAssignment: { __typename: work.typename as 'OqylymAssignment', id: work.id, visible: !visible } },
      });
    }
  };
  const deleteWork = async () => {
    const result = await remove({ variables: { id: work.id } }).catch(() => null);
    setConfirmDelete(false);
    if (!result?.data) return;
    router.back();
    evictEntity(client.cache, work.typename, work.id);
  };
  const openReview = () => {
    setClassFilter('review', work.classId);
    router.navigate({ pathname: '/teacher/school', params: { tab: 'review' } });
  };

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('classes.school')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 13, paddingBottom: insets.bottom + 38 }}>
        <View className="flex-row items-center justify-between gap-2.5">
          <Text className="font-body text-[11px] leading-[16.5px] text-[#96a4b8]">
            {work.className} · {shortDate(work.date, language)}
          </Text>
          <StatusMark status={work.status === 'published' ? 'done' : 'pending'} label={t(`classes.status.${work.status}`)} size={16} />
        </View>
        <Text className="mb-5 mt-[15px] font-body-semibold text-[22px] leading-[30px] text-[#303d52]">{content(work.name)}</Text>

        <View className="mb-[22px] flex-row gap-2">
          <SoftAction icon="play" label={t('teacherAssignments.preview')} disabled={!previewHref} onPress={() => previewHref && router.push(previewHref)} />
          {work.kind === 'oqylym' || work.kind === 'tyndalym' ? (
            <SoftAction icon="pen" label={t('teacherAssignments.edit')} onPress={() => setEditing(true)} />
          ) : null}
        </View>

        <View className="mb-[22px] rounded-[14px] bg-[#f4f8fe] p-4">
          <View className="mb-3 h-8 flex-row items-center gap-2">
            <Text className="font-body-medium text-[23px] leading-[29px] text-[#6c99d8]">
              {n.done}
              <Text className="font-body-medium text-[15px] text-[#abc1df]">/{n.total}</Text>
            </Text>
            <Text className="flex-1 font-body text-[11px] leading-[16.5px] text-[#9aacbf]">{t('teacherAssignments.submitted')}</Text>
            {n.pending ? (
              <Pressable accessibilityRole="button" onPress={openReview} className="flex-row items-center gap-[5px] py-[3px]">
                <Text className="font-body text-[11px] leading-[16.5px] text-[#719bd5]">{t('teacherAssignments.toReview', { count: n.pending })}</Text>
                <Icon name="arrow" size={14} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
          <ProgressLine pct={n.pct} className="bg-[#e3edfb]" />
        </View>

        <Disclosure label={t('teacherAssignments.contents')} count={keys.length}>
          <View className="mb-3 pl-5">
            {keys.map((key, i) => (
              <Text key={`${key}-${i}`} className="font-body text-[12px] leading-[24px] text-[#99a9bf]">
                {i + 1}. {t(`classes.content.${key}`)}
              </Text>
            ))}
          </View>
        </Disclosure>

        <Disclosure label={t('teacherAssignments.students')} count={n.total} defaultOpen={n.done > 0}>
          {work.studentIds.map((studentId) => {
            const attempt = attempts.get(studentId);
            const name = names.get(studentId) ?? '';
            const row = (
              <>
                <StudentAvatar name={name} />
                <View className="flex-1">
                  <Text className="font-body-medium text-[12px] leading-[18px]" numberOfLines={1}>{name}</Text>
                  {attempt?.pending ? (
                    <Text className="mt-[3px] font-body text-[10px] leading-[14.5px] text-subtle">{t('teacherAssignments.needsReview')}</Text>
                  ) : null}
                </View>
                {attempt?.pending ? (
                  <Icon name="pen" size={15} color={colors.subtle} />
                ) : (
                  <Text className="font-body-medium text-[12px] leading-[18px] text-[#7095c4]">
                    {attempt?.score != null ? `${attempt.score}%` : attempt ? '✓' : '—'}
                  </Text>
                )}
              </>
            );
            return attempt?.reviewKind ? (
              <Pressable
                key={studentId}
                accessibilityRole="button"
                onPress={() => router.push(submissionHref(attempt, work.key))}
                className="min-h-[63px] flex-row items-center gap-2.5 py-2.5 active:opacity-70"
              >
                {row}
              </Pressable>
            ) : (
              <View key={studentId} className="min-h-[63px] flex-row items-center gap-2.5 py-2.5">
                {row}
              </View>
            );
          })}
        </Disclosure>

        <Disclosure label={t('teacherAssignments.manage')}>
          <View className="gap-2 pb-3">
            {canToggle ? (
              <Button
                variant="secondary"
                label={t(visible ? 'teacherAssignments.hide' : 'teacherAssignments.publish')}
                loading={toggling}
                onPress={toggleVisibility}
              />
            ) : null}
            <Button variant="danger" icon="trash" label={t('teacherAssignments.delete')} onPress={() => setConfirmDelete(true)} />
          </View>
        </Disclosure>
      </ScrollView>

      {editing ? <EditWorkDialog work={work} visible onClose={() => setEditing(false)} /> : null}
      <Dialog visible={confirmDelete} title={t('teacherAssignments.confirmDelete')} onClose={() => setConfirmDelete(false)}>
        <Text className="mb-5 font-body text-[13px] leading-[20px] text-muted">{t('teacherAssignments.deleteHint')}</Text>
        <View className="flex-row gap-2">
          <Button variant="soft" className="flex-1" label={t('teacherAssignments.cancel')} onPress={() => setConfirmDelete(false)} />
          <Button
            variant="danger"
            className="flex-1"
            icon="trash"
            label={t('teacherAssignments.delete')}
            loading={removal.loading}
            onPress={() => void deleteWork()}
          />
        </View>
      </Dialog>
    </View>
  );
}
