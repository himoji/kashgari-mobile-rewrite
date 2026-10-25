import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClassesSegment } from '@/features/classes/classes-segment';
import { ReviewSegment } from '@/features/review/review-segment';
import { AssignmentsSegment } from '@/features/teacher-assignments/assignments-segment';
import { TEACHER_SCHOOL } from '@/features/teacher-assignments/gql';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { SegmentedTabs, SegmentPanel } from '@/ui/segmented-tabs';
import { TabScreen } from '@/ui/tab-screen';

type Segment = 'assignments' | 'classes' | 'review';
const SEGMENTS: Segment[] = ['assignments', 'classes', 'review'];

/** Teacher "Мектеп" tab: assignments, classes and the review queue (`?tab=assignments|classes|review`). */
export function TeacherSchoolScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const segment: Segment = SEGMENTS.includes(params.tab as Segment) ? (params.tab as Segment) : 'assignments';
  const { refreshing, refresh } = useRefresh(TEACHER_SCHOOL);

  return (
    <View className="flex-1">
      <TabScreen
        title={t('classes.school')}
        list
        refreshing={refreshing}
        onRefresh={refresh}
      >
        <View>
          <SegmentedTabs
            variant="section"
            value={segment}
            onChange={(tab) => router.setParams({ tab })}
            options={SEGMENTS.map((value) => ({ value, label: t(`classes.tabs.${value}`) }))}
          />
          <QueryBoundary fallback={<SchoolSkeleton />}>
            <School segment={segment} />
          </QueryBoundary>
        </View>
      </TabScreen>
      {segment === 'assignments' ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 px-6 pb-2 pt-3"
          style={{
            bottom: Math.max(insets.bottom, 14) + 76,
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 25%)',
          } as object}
        >
          <Button
            icon="plus"
            label={t('teacherAssignments.assignWork')}
            onPress={() => router.push('/teacher/assign/new')}
            className="h-[46px] rounded-[13px] bg-primary-strong"
          />
        </View>
      ) : null}
    </View>
  );
}

function SchoolSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton className="h-12" />
      <Skeleton className="h-[102px]" />
      <Skeleton className="h-[102px]" />
      <Skeleton className="h-[102px]" />
    </View>
  );
}

function School({ segment }: { segment: Segment }) {
  const school = useTeacherSchool();
  return (
    <SegmentPanel id={segment}>
      {segment === 'assignments' ? (
        <AssignmentsSegment classes={school.classes} />
      ) : segment === 'classes' ? (
        <ClassesSegment
          classes={school.classes}
          onOpenClass={(id) => router.push({ pathname: '/teacher/class/[id]', params: { id } })}
        />
      ) : (
        <ReviewSegment classes={school.classes} />
      )}
    </SegmentPanel>
  );
}
