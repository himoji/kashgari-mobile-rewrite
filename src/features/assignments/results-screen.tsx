import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState, Skeleton } from '@/ui/feedback';
import { IconButton } from '@/ui/icon-button';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

import { AssignmentCard } from './assignment-card';
import { STUDENT_ASSIGNMENTS } from './gql';
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

function Summary({ completed, average }: { completed?: number; average?: number }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-3 rounded-[20px] bg-primary p-[18px]">
      <SummaryValue label={t('assignments.results.completed')} value={completed != null ? String(completed) : '–'} />
      <SummaryValue divided label={t('assignments.results.average')} value={average != null ? `${average}%` : '–'} />
    </View>
  );
}

/** Pushed from Home: completed work with a summary of how many are done and the average score. */
export function ResultsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refreshing, refresh } = useRefresh(STUDENT_ASSIGNMENTS);

  return (
    <View className="flex-1">
      <TabScreen title={t('assignments.results.title')} mascot="results" refreshing={refreshing} onRefresh={refresh}>
        <QueryBoundary
          fallback={
            <>
              <Summary />
              <View className="gap-2.5">
                <Skeleton className="h-[146px]" />
                <Skeleton className="h-[146px]" />
              </View>
            </>
          }
        >
          <Results />
        </QueryBoundary>
      </TabScreen>
      <View className="absolute left-5" style={{ top: Math.max(insets.top, 20) + 10 }}>
        <IconButton tone="glass" icon="back" label={t('common.actions.back')} onPress={() => router.back()} />
      </View>
    </View>
  );
}

function Results() {
  const { t } = useTranslation();
  const { completed } = useStudentAssignments();
  return (
    <>
      <Summary completed={completed.length} average={averageScore(completed)} />
      {completed.length === 0 ? (
        <EmptyState illustration="progress" title={t('assignments.empty.completed')} />
      ) : (
        <View className="gap-2.5">
          {completed.map((a) => (
            <AssignmentCard key={`${a.kind}:${a.id}`} item={a} />
          ))}
        </View>
      )}
    </>
  );
}
