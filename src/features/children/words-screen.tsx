import { useSuspenseQuery } from '@apollo/client/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/features/children/child-parts';
import { splitWords } from '@/features/children/children-data';
import { CHILD_WORDS } from '@/features/children/gql';
import { useChildName } from '@/features/children/use-children';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { BackBar } from '@/ui/back-bar';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { SegmentedTabs, SegmentPanel } from '@/ui/segmented-tabs';
import { Text } from '@/ui/text';

type Tab = 'learned' | 'learning';

/** A child's vocabulary: words already learned and words still being learned. Tapping a word opens its card. */
export function ChildWordsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { child: childId } = useLocalSearchParams<{ child: string }>();
  const childName = useChildName(childId);
  // Lives out here so the tabs keep their selection across loading and retry.
  const [tab, setTab] = useState<Tab>('learned');

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={childName ?? t('common.actions.back')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        <Text className="mb-[3px] font-body-semibold text-[21px] leading-[28px]">{t('parent.words')}</Text>
        <Text className="mb-5 font-body text-[12px] leading-[18px] text-subtle">{t('parent.wordsHint')}</Text>
        <QueryBoundary
          fallback={
            <>
              <WordTabs tab={tab} onChange={setTab} learned={0} learning={0} />
              <View className="gap-2.5">
                <Skeleton className="h-[58px]" />
                <Skeleton className="h-[58px]" />
                <Skeleton className="h-[58px]" />
              </View>
            </>
          }
        >
          <Words childId={childId} tab={tab} onTabChange={setTab} />
        </QueryBoundary>
      </ScrollView>
    </View>
  );
}

function WordTabs({ tab, onChange, learned, learning }: { tab: Tab; onChange: (tab: Tab) => void; learned: number; learning: number }) {
  const { t } = useTranslation();
  return (
    <SegmentedTabs
      value={tab}
      onChange={onChange}
      className="mb-4"
      options={[
        { value: 'learned', label: t('parent.learned'), count: learned },
        { value: 'learning', label: t('parent.learning'), count: learning },
      ]}
    />
  );
}

function Words({ childId, tab, onTabChange }: { childId: string; tab: Tab; onTabChange: (tab: Tab) => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(CHILD_WORDS, { variables: { studentId: childId }, queryKey });
  const words = data.student?.words;
  const lists = useMemo(() => splitWords(words ?? []), [words]);
  const list = lists[tab];

  return (
    <>
      <WordTabs tab={tab} onChange={onTabChange} learned={lists.learned.length} learning={lists.learning.length} />
      <SegmentPanel id={tab}>
        {list.length === 0 ? (
          <EmptyState title={t(tab === 'learned' ? 'parent.noLearned' : 'parent.noLearning')} illustration="materials" />
        ) : (
          <View className="gap-2.5">
            {list.map((w) => (
              <Pressable
                key={w.word}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/word', params: { word: w.word } })}
                className="press-row min-h-[58px] flex-row items-center gap-3 rounded-[16.5px] bg-surface px-[14px] py-3 shadow-item active:opacity-80"
              >
                <Text className="flex-1 font-body-semibold text-[16px] leading-[22px]" numberOfLines={1}>{content(w.word)}</Text>
                <Chip label={t('parent.wordLevel', { level: w.level })} />
                <Icon name="arrow" size={18} color={colors.ink} />
              </Pressable>
            ))}
          </View>
        )}
      </SegmentPanel>
    </>
  );
}
