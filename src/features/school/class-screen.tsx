import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { studentAttempts, studentSummaries } from '@/features/classes/class-data';
import { ClassDetailView } from '@/features/classes/class-detail-view';
import { StudentProgressDialog } from '@/features/classes/student-progress-dialog';
import { useSchool } from '@/features/school/use-school';
import { BackBar } from '@/ui/back-bar';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { Text } from '@/ui/text';

/** Principal's class page: the teacher's roster view, read-only (no grading, no assignment shortcuts). */
export function PrincipalClassScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { school, loading, error, refetch } = useSchool();
  const [studentId, setStudentId] = useState<string | null>(null);
  const classWork = school?.classes.find((c) => c.id === id);
  const student = classWork?.students.find((s) => s.id === studentId);

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('principal.schoolTitle')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
        {loading ? (
          <View className="gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </View>
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : !classWork ? (
          <EmptyState title={t('classes.noClasses')} illustration="classroom" />
        ) : (
          <>
            <ClassDetailView className={classWork.name} summaries={studentSummaries(classWork)} onOpenStudent={setStudentId} />
            <Text className="mt-4 font-body text-[12px] leading-[18px] text-subtle">
              {t('principal.teacher')}: {classWork.teacherName}
            </Text>
          </>
        )}
      </ScrollView>
      {classWork ? (
        <StudentProgressDialog
          visible={!!student}
          studentName={student?.name ?? ''}
          rows={student ? studentAttempts(classWork, student.id) : []}
          onClose={() => setStudentId(null)}
        />
      ) : null}
    </View>
  );
}
