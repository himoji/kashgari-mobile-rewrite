import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AssignmentCard } from '@/features/assignments/assignment-card';
import type { AssignmentKind } from '@/features/assignments/routes';
import { moduleAssignments, moduleBreakdown } from '@/features/children/children-data';
import { useChildAssignments, useChildren } from '@/features/children/use-children';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { BackBar } from '@/ui/back-bar';
import { Text } from '@/ui/text';

/** One module of a child's work: every assignment with its status and score, read-only. */
export function ChildModuleScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { child: childId, kind } = useLocalSearchParams<{ child: string; kind: AssignmentKind }>();
  const { children } = useChildren();
  const child = children.find((c) => c.id === childId);
  const work = useChildAssignments(childId);
  const items = moduleAssignments(work.all, kind);
  const summary = moduleBreakdown(items)[0];

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={child?.name ?? t('common.actions.back')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        <Text className="mb-[3px] font-body-semibold text-[21px] leading-[28px]">{t(`assignments.modules.${kind}`)}</Text>
        <Text className="mb-5 font-body text-[12px] leading-[18px] text-subtle">
          {summary
            ? [t('parent.doneOf', { done: summary.done, total: summary.total }), summary.average != null ? t('parent.averageValue', { value: summary.average }) : null]
                .filter(Boolean)
                .join(' · ')
            : ' '}
        </Text>
        {work.loading ? (
          <View className="gap-3">
            <Skeleton className="h-[110px]" />
            <Skeleton className="h-[110px]" />
          </View>
        ) : work.error ? (
          <ErrorState onRetry={work.refetch} />
        ) : items.length === 0 ? (
          <EmptyState title={t('parent.noWork')} illustration="classroom" />
        ) : (
          <View className="gap-2.5">
            {items.map((a) => (
              <AssignmentCard key={a.id} item={a} readOnly />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
