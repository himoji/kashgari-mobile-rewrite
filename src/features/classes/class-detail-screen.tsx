import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { studentAttempts, studentSummaries } from '@/features/classes/class-data';
import { ClassDetailView } from '@/features/classes/class-detail-view';
import { StudentProgressDialog } from '@/features/classes/student-progress-dialog';
import { submissionHref } from '@/features/review/routes';
import { useSchoolFilters, type FilterScope } from '@/features/teacher-assignments/filters';
import { TEACHER_SCHOOL } from '@/features/teacher-assignments/gql';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';

/** Teacher's class page: roster grades, a student's progress dialog, shortcuts to the class's work and answers. */
export function ClassDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refreshing, refresh } = useRefresh(TEACHER_SCHOOL);
  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('classes.school')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <QueryBoundary
          fallback={
            <View className="gap-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </View>
          }
        >
          <ClassDetail />
        </QueryBoundary>
      </ScrollView>
    </View>
  );
}

function ClassDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const school = useTeacherSchool();
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);
  const [studentId, setStudentId] = useState<string | null>(null);
  const classWork = school.classes.find((c) => c.id === id);

  const openSchool = (scope: FilterScope, tab: string) => {
    setClassFilter(scope, id);
    router.navigate({ pathname: '/teacher/school', params: { tab } });
  };

  if (!classWork) return <EmptyState title={t('classes.noClasses')} illustration="classroom" />;
  const student = classWork.students.find((s) => s.id === studentId);

  return (
    <>
      <ClassDetailView
        className={classWork.name}
        summaries={studentSummaries(classWork)}
        onOpenStudent={setStudentId}
        footer={
          <>
            <Button
              variant="soft"
              label={t('classes.assignments')}
              onPress={() => openSchool('assignments', 'assignments')}
              className="h-11 flex-1 bg-[#f2f6fc] px-2"
            />
            <Button
              label={t('classes.reviewAnswers')}
              onPress={() => openSchool('review', 'review')}
              className="h-11 flex-1 bg-primary-strong px-2"
            />
          </>
        }
      />
      {/* A modal, so it can live inside the scroll view. */}
      <StudentProgressDialog
        visible={!!student}
        studentName={student?.name ?? ''}
        rows={student ? studentAttempts(classWork, student.id) : []}
        onOpen={(row) => {
          setStudentId(null);
          router.push(submissionHref(row.attempt, row.work.key));
        }}
        onClose={() => setStudentId(null)}
      />
    </>
  );
}
