import { useSuspenseQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { MATERIALS_CONTEXT, MATERIALS_GRADE } from '@/features/materials/gql';
import { sectionName, topicItems, type LibraryItem } from '@/features/materials/library-items';
import { materialParam } from '@/features/materials/material-ref';
import { useGrades } from '@/features/materials/use-grades';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { ChoiceRow, Dialog } from '@/ui/dialog';
import { NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRefresh, useRetryKey } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

const rowShadow = { boxShadow: '0 3px 12px rgba(36,38,49,0.055)' };
const pillShadow = { boxShadow: '0 2px 8px rgba(36,38,49,0.04)' };

function Row({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-[72px] flex-row items-center gap-3 rounded-[15px] bg-surface p-[14px] active:opacity-80" style={rowShadow}>
      <View className="flex-1">
        <Text variant="strong" numberOfLines={2}>{title}</Text>
        <Text className="mt-1 font-body text-[11px] leading-[16px] text-subtle">{hint}</Text>
      </View>
      <Icon name="arrow" size={17} color={colors.ink} />
    </Pressable>
  );
}

function TopicDialog({ topic, items, onClose }: { topic: string; items: LibraryItem[]; onClose: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  const go = (path: string, params: Record<string, string>) => {
    onClose();
    router.push({ pathname: path as never, params });
  };
  return (
    <Dialog visible title={topic} onClose={onClose} className="mx-2.5">
      <View className="gap-4">
        {items.length ? null : <Text className="font-body text-[14px] leading-[21px] text-body">{t('materials.noMaterials')}</Text>}
        {items.map((m) => (
          <View key={materialParam(m.ref)} className="rounded-[14px] bg-[#f7f9fd] p-[14px]">
            <Text className="font-body text-[11px] leading-[16.5px] text-[#98a6ba]">{t(`materials.modules.${m.ref.kind}`)}</Text>
            <Text className="mb-[18px] mt-2 font-body-semibold text-[16px] leading-[24px]">{content(m.title)}</Text>
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => go('/teacher/material/[id]', { id: m.ref.id, kind: m.ref.kind })}
                className="h-[42px] flex-1 items-center justify-center rounded-[11px] bg-surface active:opacity-80"
                style={{ boxShadow: '0 2px 7px rgba(36,38,49,0.024)' }}
              >
                <Text className="font-body-semibold text-[12px] leading-[15px] text-[#7995bc]">{t('materials.open')}</Text>
              </Pressable>
              <Button
                label={t('materials.assign')}
                className="h-[42px] flex-1 rounded-[11px] px-1.5"
                onPress={() => go('/teacher/assign/new', { material: materialParam(m.ref) })}
              />
            </View>
          </View>
        ))}
      </View>
    </Dialog>
  );
}

type DialogName = 'grade' | 'subject' | null;
type Topic = { name: string; items: LibraryItem[] };

/** Materials tab: the curriculum for a grade, topic by topic, and the way into the library. */
export function CurriculumScreen() {
  const { t } = useTranslation();
  const content = useContentText();
  const [picked, setPicked] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const { refreshing, refresh } = useRefresh(MATERIALS_CONTEXT, MATERIALS_GRADE);

  return (
    <TabScreen title={t('materials.title')} refreshing={refreshing} onRefresh={refresh}>
      <QueryBoundary
        fallback={
          <CurriculumLayout grade={null} onDialog={setDialog}>
            <TopicsSkeleton />
          </CurriculumLayout>
        }
      >
        <Curriculum picked={picked} onPick={setPicked} dialog={dialog} onDialog={setDialog} onTopic={setTopic} />
      </QueryBoundary>

      {topic ? <TopicDialog topic={content(topic.name)} items={topic.items} onClose={() => setTopic(null)} /> : null}
      <Dialog visible={dialog === 'subject'} title={t('materials.subject')} onClose={() => setDialog(null)}>
        <View className="gap-[7px]">
          <ChoiceRow label={t('materials.kazakhLanguage')} selected onPress={() => setDialog(null)} />
          <ChoiceRow label={t('materials.kazakhLiterature')} disabled onPress={() => undefined} />
          <NotReady className="mt-2" />
        </View>
      </Dialog>
    </TabScreen>
  );
}

/** Grade and subject pills, the topic list (children), the library row and the quarters note. */
function CurriculumLayout({ grade, onDialog, children }: { grade: number | null; onDialog: (d: DialogName) => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => onDialog('grade')}
          className="h-11 flex-row items-center gap-2 rounded-[11px] bg-[#f1f6ff] px-3 active:opacity-80"
          style={pillShadow}
        >
          <Text className="font-body-semibold text-[12px] leading-[18px] text-link">{grade != null ? t('materials.gradeLabel', { grade }) : '—'}</Text>
          <Icon name="down" size={16} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onDialog('subject')}
          className="h-11 flex-row items-center gap-2 rounded-[11px] bg-surface px-3 active:opacity-80"
          style={pillShadow}
        >
          <Text className="font-body-semibold text-[11px] leading-[16.5px] text-muted">{t('materials.kazakhLanguage')}</Text>
          <Icon name="down" size={16} color={colors.ink} />
        </Pressable>
      </View>

      <View className="mt-0.5 gap-2.5">
        {children}
        <Row title={t('materials.library')} hint={t('materials.libraryHint')} onPress={() => router.push('/teacher/library')} />
      </View>
      <NotReady title={t('materials.quarters')} body={t('materials.quartersBody')} />
    </>
  );
}

function TopicsSkeleton() {
  return (
    <>
      <Skeleton className="h-[72px]" />
      <Skeleton className="h-[72px]" />
    </>
  );
}

function Curriculum({
  picked,
  onPick,
  dialog,
  onDialog,
  onTopic,
}: {
  picked: number | null;
  onPick: (grade: number) => void;
  dialog: DialogName;
  onDialog: (d: DialogName) => void;
  onTopic: (topic: Topic) => void;
}) {
  const { t } = useTranslation();
  const { grades, defaultGrade } = useGrades();
  const grade = picked ?? defaultGrade;

  return (
    <>
      <CurriculumLayout grade={grade} onDialog={onDialog}>
        {grade == null ? (
          <TopicsSkeleton />
        ) : (
          <QueryBoundary fallback={<TopicsSkeleton />}>
            <Topics grade={grade} onTopic={onTopic} />
          </QueryBoundary>
        )}
      </CurriculumLayout>
      <Dialog visible={dialog === 'grade'} title={t('materials.chooseGrade')} onClose={() => onDialog(null)}>
        <View className="gap-[7px]">
          {grades.map((g) => (
            <ChoiceRow key={g} label={t('materials.gradeLabel', { grade: g })} selected={g === grade} onPress={() => (onPick(g), onDialog(null))} />
          ))}
        </View>
      </Dialog>
    </>
  );
}

function Topics({ grade, onTopic }: { grade: number; onTopic: (topic: Topic) => void }) {
  const { t, i18n } = useTranslation();
  const { profileId } = useProfile();
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(MATERIALS_GRADE, { variables: { grade, teacherId: profileId }, queryKey });
  const topics = (data.grade?.sections ?? []).map((s) => {
    const name = sectionName(s.name, s.section, i18n.language, t('materials.section'));
    return { key: String(s.section), name, items: topicItems(s, data.grade?.grade ?? null, name) };
  });

  if (!topics.length) {
    return (
      <View className="items-center rounded-[15px] bg-canvas px-4 py-8">
        <Text variant="heading" className="text-center">{t('materials.noMaterials')}</Text>
      </View>
    );
  }
  return (
    <>
      {topics.map((tp) => (
        <Row
          key={tp.key}
          title={content(tp.name)}
          hint={t('materials.materialsCount', { count: tp.items.length })}
          onPress={() => onTopic({ name: tp.name, items: tp.items })}
        />
      ))}
    </>
  );
}
