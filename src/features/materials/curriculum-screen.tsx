import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { MATERIALS_GRADE } from '@/features/materials/gql';
import { sectionName, topicItems, type LibraryItem } from '@/features/materials/library-items';
import { materialParam } from '@/features/materials/material-ref';
import { useGrades } from '@/features/materials/use-grades';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { ChoiceRow, Dialog } from '@/ui/dialog';
import { ErrorState, NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
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

/** Materials tab: the curriculum for a grade, topic by topic, and the way into the library. */
export function CurriculumScreen() {
  const { t, i18n } = useTranslation();
  const { profileId } = useProfile();
  const content = useContentText();
  const { grades, defaultGrade, error: gradesError, refetch: refetchGrades } = useGrades();
  const [picked, setPicked] = useState<number | null>(null);
  const [dialog, setDialog] = useState<'grade' | 'subject' | null>(null);
  const [topic, setTopic] = useState<{ name: string; items: LibraryItem[] } | null>(null);
  const grade = picked ?? defaultGrade;

  const { data, loading, error, refetch, networkStatus } = useQuery(MATERIALS_GRADE, {
    variables: { grade: grade ?? 0, teacherId: profileId },
    skip: grade == null,
    notifyOnNetworkStatusChange: true,
  });
  const topics = (data?.grade?.sections ?? []).map((s) => {
    const name = sectionName(s.name, s.section, i18n.language, t('materials.section'));
    return { key: String(s.section), name, items: topicItems(s, data?.grade?.grade ?? null, name) };
  });

  return (
    <TabScreen
      title={t('materials.title')}
      mascot="learning"
      refreshing={networkStatus === 4}
      onRefresh={() => void (refetchGrades(), refetch())}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => setDialog('grade')}
          className="h-11 flex-row items-center gap-2 rounded-[11px] bg-[#f1f6ff] px-3 active:opacity-80"
          style={pillShadow}
        >
          <Text className="font-body-semibold text-[12px] leading-[18px] text-link">{grade != null ? t('materials.gradeLabel', { grade }) : '—'}</Text>
          <Icon name="down" size={16} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDialog('subject')}
          className="h-11 flex-row items-center gap-2 rounded-[11px] bg-surface px-3 active:opacity-80"
          style={pillShadow}
        >
          <Text className="font-body-semibold text-[11px] leading-[16.5px] text-muted">{t('materials.kazakhLanguage')}</Text>
          <Icon name="down" size={16} color={colors.ink} />
        </Pressable>
      </View>

      <View className="mt-0.5 gap-2.5">
        {gradesError || error ? (
          <ErrorState onRetry={() => void (refetchGrades(), refetch())} />
        ) : loading || grade == null ? (
          <>
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </>
        ) : topics.length ? (
          topics.map((tp) => (
            <Row
              key={tp.key}
              title={content(tp.name)}
              hint={t('materials.materialsCount', { count: tp.items.length })}
              onPress={() => setTopic({ name: tp.name, items: tp.items })}
            />
          ))
        ) : (
          <View className="items-center rounded-[15px] bg-canvas px-4 py-8">
            <Text variant="heading" className="text-center">{t('materials.noMaterials')}</Text>
          </View>
        )}
        <Row title={t('materials.library')} hint={t('materials.libraryHint')} onPress={() => router.push('/teacher/library')} />
      </View>
      <NotReady title={t('materials.quarters')} body={t('materials.quartersBody')} />

      {topic ? <TopicDialog topic={content(topic.name)} items={topic.items} onClose={() => setTopic(null)} /> : null}
      <Dialog visible={dialog === 'grade'} title={t('materials.chooseGrade')} onClose={() => setDialog(null)}>
        <View className="gap-[7px]">
          {grades.map((g) => (
            <ChoiceRow key={g} label={t('materials.gradeLabel', { grade: g })} selected={g === grade} onPress={() => (setPicked(g), setDialog(null))} />
          ))}
        </View>
      </Dialog>
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
