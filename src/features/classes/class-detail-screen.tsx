import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { studentAttempts, studentSummaries } from '@/features/classes/class-data';
import { ClassDetailView } from '@/features/classes/class-detail-view';
import { StudentProgressDialog } from '@/features/classes/student-progress-dialog';
import { submissionHref } from '@/features/review/routes';
import { useSchoolFilters, type FilterScope } from '@/features/teacher-assignments/filters';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { BackBar } from '@/ui/back-bar';
import { Button } from '@/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';

/** Teacher's class page: roster grades, a student's progress dialog, shortcuts to the class's work and answers. */
export function ClassDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const school = useTeacherSchool();
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);
  const [studentId, setStudentId] = useState<string | null>(null);
  const classWork = school.classes.find((c) => c.id === id);

  const openSchool = (scope: FilterScope, tab: string) => {
    setClassFilter(scope, id);
    router.navigate({ pathname: '/teacher/school', params: { tab } });
  };

  const student = classWork?.students.find((s) => s.id === studentId);

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('classes.school')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        {school.loading ? (
          <View className="gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </View>
        ) : school.error && !school.classes.length ? (
          <ErrorState onRetry={() => void school.refetch()} />
        ) : !classWork ? (
          <EmptyState title={t('classes.noClasses')} illustration="classroom" />
        ) : (
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
        )}
      </ScrollView>
      {classWork ? (
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
      ) : null}
    </View>
  );
}
