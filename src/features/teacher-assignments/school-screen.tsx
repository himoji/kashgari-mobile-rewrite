import { router, useLocalSearchParams, type Href } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClassesSegment } from '@/features/classes/classes-segment';
import { ReviewSegment } from '@/features/review/review-segment';
import { AssignmentsSegment } from '@/features/teacher-assignments/assignments-segment';
import { SchoolTabs } from '@/features/teacher-assignments/school-tabs';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { Button } from '@/ui/button';
import { ErrorState, Skeleton } from '@/ui/feedback';
import { TabScreen } from '@/ui/tab-screen';

type Segment = 'assignments' | 'classes' | 'review';
const SEGMENTS: Segment[] = ['assignments', 'classes', 'review'];

/** Teacher "Мектеп" tab: assignments, classes and the review queue (`?tab=assignments|classes|review`). */
export function TeacherSchoolScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const segment: Segment = SEGMENTS.includes(params.tab as Segment) ? (params.tab as Segment) : 'assignments';
  const school = useTeacherSchool();

  const body = school.loading ? (
    <View className="gap-3">
      <Skeleton className="h-12" />
      <Skeleton className="h-[102px]" />
      <Skeleton className="h-[102px]" />
      <Skeleton className="h-[102px]" />
    </View>
  ) : school.error && !school.classes.length ? (
    <ErrorState onRetry={() => void school.refetch()} />
  ) : segment === 'assignments' ? (
    <AssignmentsSegment classes={school.classes} />
  ) : segment === 'classes' ? (
    <ClassesSegment
      classes={school.classes}
      onOpenClass={(id) => router.push({ pathname: '/teacher/class/[id]', params: { id } })}
    />
  ) : (
    <ReviewSegment classes={school.classes} />
  );

  return (
    <View className="flex-1">
      <TabScreen
        title={t('classes.school')}
        refreshing={school.refreshing}
        onRefresh={() => void school.refetch()}
      >
        <View>
          <SchoolTabs
            value={segment}
            onChange={(tab) => router.setParams({ tab })}
            options={SEGMENTS.map((value) => ({ value, label: t(`classes.tabs.${value}`) }))}
          />
          {body}
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
            onPress={() => router.push('/teacher/assign/new' as Href)}
            className="h-[46px] rounded-[13px] bg-primary-strong"
          />
        </View>
      ) : null}
    </View>
  );
}
