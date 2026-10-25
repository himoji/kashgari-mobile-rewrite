import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { SegmentedTabs } from '@/ui/segmented-tabs';
import { TabScreen } from '@/ui/tab-screen';

import { AssignmentCard } from './assignment-card';
import { STUDENT_ASSIGNMENTS } from './gql';
import { useStudentAssignments } from './use-student-assignments';

type Segment = 'new' | 'completed';

function Segments({ value, onChange, counts }: { value: Segment; onChange: (s: Segment) => void; counts?: Record<Segment, number> }) {
  const { t } = useTranslation();
  return (
    <SegmentedTabs
      value={value}
      onChange={onChange}
      className="mb-0.5"
      options={[
        { value: 'new', label: t('assignments.tabs.new'), count: counts?.new },
        { value: 'completed', label: t('assignments.tabs.completed'), count: counts?.completed },
      ]}
    />
  );
}

/** The student's School tab: new and completed work from every module. */
export function SchoolScreen() {
  const { t } = useTranslation();
  const { refreshing, refresh } = useRefresh(STUDENT_ASSIGNMENTS);
  const [segment, setSegment] = useState<Segment>('new');

  return (
    <TabScreen title={t('common.tabs.school')} mascot="learning" refreshing={refreshing} onRefresh={refresh}>
      <QueryBoundary
        fallback={
          <>
            <Segments value={segment} onChange={setSegment} />
            <View className="gap-2.5">
              <Skeleton className="h-[146px]" />
              <Skeleton className="h-[146px]" />
              <Skeleton className="h-[146px]" />
            </View>
          </>
        }
      >
        <School segment={segment} onSegment={setSegment} />
      </QueryBoundary>
    </TabScreen>
  );
}

function School({ segment, onSegment }: { segment: Segment; onSegment: (s: Segment) => void }) {
  const { t } = useTranslation();
  const { fresh, completed } = useStudentAssignments();
  const list = segment === 'new' ? fresh : completed;

  return (
    <>
      <Segments value={segment} onChange={onSegment} counts={{ new: fresh.length, completed: completed.length }} />
      {list.length === 0 ? (
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
    </>
  );
}
