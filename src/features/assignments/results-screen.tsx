import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { IconButton } from '@/ui/icon-button';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

import { AssignmentCard } from './assignment-card';
import { averageScore } from './map';
import { useStudentAssignments } from './use-student-assignments';

function SummaryValue({ label, value, divided }: { label: string; value: string; divided?: boolean }) {
  return (
    <View className={divided ? 'flex-1 gap-2 pl-4' : 'flex-1 gap-2'}>
      <Text className="font-body text-[12px] leading-[16px] text-white">{label}</Text>
      <Text className="font-body-semibold text-[30px] leading-[34px] text-white">{value}</Text>
    </View>
  );
}

/** Pushed from Home: completed work with a summary of how many are done and the average score. */
export function ResultsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { completed, loading, error, refreshing, refetch } = useStudentAssignments();
  const average = averageScore(completed);

  return (
    <View className="flex-1">
      <TabScreen title={t('assignments.results.title')} mascot="results" refreshing={refreshing} onRefresh={refetch}>
        <View className="flex-row gap-3 rounded-[20px] bg-primary p-[18px]">
          <SummaryValue label={t('assignments.results.completed')} value={loading ? '–' : String(completed.length)} />
          <SummaryValue divided label={t('assignments.results.average')} value={average != null ? `${average}%` : '–'} />
        </View>
        {loading ? (
          <View className="gap-2.5">
            <Skeleton className="h-[146px]" />
            <Skeleton className="h-[146px]" />
          </View>
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : completed.length === 0 ? (
          <EmptyState illustration="progress" title={t('assignments.empty.completed')} />
        ) : (
          <View className="gap-2.5">
            {completed.map((a) => (
              <AssignmentCard key={`${a.kind}:${a.id}`} item={a} />
            ))}
          </View>
        )}
      </TabScreen>
      <View className="absolute left-5" style={{ top: Math.max(insets.top, 20) + 10 }}>
        <IconButton tone="glass" icon="back" label={t('common.actions.back')} onPress={() => router.back()} />
      </View>
    </View>
  );
}
