import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { SegmentedTabs } from '@/ui/segmented-tabs';
import { TabScreen } from '@/ui/tab-screen';

import { AssignmentCard } from './assignment-card';
import { useStudentAssignments } from './use-student-assignments';

type Segment = 'new' | 'completed';

/** The student's School tab: new and completed work from every module. */
export function SchoolScreen() {
  const { t } = useTranslation();
  const { fresh, completed, loading, error, refreshing, refetch } = useStudentAssignments();
  const [segment, setSegment] = useState<Segment>('new');
  const list = segment === 'new' ? fresh : completed;

  return (
    <TabScreen title={t('common.tabs.school')} mascot="learning" refreshing={refreshing} onRefresh={refetch}>
      <SegmentedTabs
        value={segment}
        onChange={setSegment}
        className="mb-0.5"
        options={[
          { value: 'new', label: t('assignments.tabs.new'), count: loading ? undefined : fresh.length },
          { value: 'completed', label: t('assignments.tabs.completed'), count: loading ? undefined : completed.length },
        ]}
      />
      {loading ? (
        <View className="gap-2.5">
          <Skeleton className="h-[146px]" />
          <Skeleton className="h-[146px]" />
          <Skeleton className="h-[146px]" />
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : list.length === 0 ? (
        segment === 'new' ? (
          <EmptyState illustration="classroom" title={t('assignments.empty.new')} body={t('assignments.empty.newBody')} />
        ) : (
          <EmptyState illustration="progress" title={t('assignments.empty.completed')} />
        )
      ) : (
        <View className="gap-2.5">
          {list.map((a) => (
            <AssignmentCard key={`${a.kind}:${a.id}`} item={a} />
          ))}
        </View>
      )}
    </TabScreen>
  );
}
