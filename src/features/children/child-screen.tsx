import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AssignmentCard } from '@/features/assignments/assignment-card';
import { averageScore, isCompleted } from '@/features/assignments/map';
import { childLine, ChildProgressCard, ModuleRow } from '@/features/children/child-parts';
import { moduleBreakdown, recentAssignments } from '@/features/children/children-data';
import { useChildAssignments, useChildren } from '@/features/children/use-children';
import { Stat } from '@/features/reports/report-parts';
import { Avatar } from '@/ui/avatar';
import { BackBar } from '@/ui/back-bar';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { ListRow } from '@/ui/list-row';
import { Text } from '@/ui/text';

function SectionTitle({ title }: { title: string }) {
  return <Text className="mb-2.5 mt-6 font-body-semibold text-[17px] leading-[24px]">{title}</Text>;
}

/** A child's dashboard for the parent: progress, modules, latest work (read-only) and vocabulary. */
export function ChildScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, loading: childrenLoading } = useChildren();
  const child = children.find((c) => c.id === id);
  const work = useChildAssignments(id);
  const modules = moduleBreakdown(work.all);

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('common.tabs.home')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        {childrenLoading ? (
          <Skeleton className="h-14" />
        ) : child ? (
          <View className="mb-5 flex-row items-center gap-3">
            <Avatar name={child.name} size={48} />
            <View className="flex-1">
              <Text className="mb-[3px] font-body-semibold text-[21px] leading-[28px]" numberOfLines={2}>{child.name}</Text>
              <Text className="font-body text-[12px] leading-[18px] text-subtle" numberOfLines={1}>{childLine(child)}</Text>
            </View>
          </View>
        ) : null}

        {child ? (
          <View className="mb-3 flex-row gap-3">
            <Stat label={t('parent.streak')} value={t('parent.streakDays', { count: child.streak })} />
            <Stat label={t('parent.languageLevel')} value={child.level} />
          </View>
        ) : null}

        {work.loading ? (
          <View className="gap-3">
            <Skeleton className="h-[156px] rounded-[20px]" />
            <Skeleton className="h-[200px]" />
          </View>
        ) : work.error ? (
          <ErrorState onRetry={work.refetch} />
        ) : work.all.length === 0 ? (
          <EmptyState title={t('parent.noWork')} body={t('parent.noWorkBody')} illustration="classroom" />
        ) : (
          <>
            <ChildProgressCard done={work.all.filter(isCompleted).length} total={work.all.length} average={averageScore(work.all)} />

            <SectionTitle title={t('parent.modules')} />
            <View className="rounded-card bg-surface px-[14px] py-1 shadow-panel">
              {modules.map((m, i) => (
                <View key={m.kind} className={i > 0 ? 'border-t border-line' : undefined}>
                  <ModuleRow summary={m} onPress={() => router.push({ pathname: '/parent/module/[child]/[kind]', params: { child: id, kind: m.kind } })} />
                </View>
              ))}
            </View>

            <SectionTitle title={t('parent.recent')} />
            <View className="gap-2.5">
              {recentAssignments(work.all).map((a) => (
                <AssignmentCard key={`${a.kind}:${a.id}`} item={a} readOnly />
              ))}
            </View>
          </>
        )}

        <ListRow
          className="mt-6"
          icon="solid-book"
          title={t('parent.words')}
          subtitle={t('parent.wordsHint')}
          onPress={() => router.push({ pathname: '/parent/words/[child]', params: { child: id } })}
        />
      </ScrollView>
    </View>
  );
}
