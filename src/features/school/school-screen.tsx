import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ReportSelect } from '@/features/reports/report-parts';
import { classRows, teacherRows } from '@/features/school/school-data';
import { ClassTable, TeacherCard } from '@/features/school/school-parts';
import { SCHOOL_PRINCIPAL } from '@/features/school/gql';
import { useSchool } from '@/features/school/use-school';
import { SchoolTabs } from '@/features/teacher-assignments/school-tabs';
import { cn } from '@/ui/cn';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';

type Segment = 'teachers' | 'classes';
const SEGMENTS: Segment[] = ['teachers', 'classes'];

/** Principal "Мектеп" tab: the school's teachers and classes (`?tab=teachers|classes`). */
export function PrincipalSchoolScreen() {
  const { t } = useTranslation();
  const { refreshing, refresh } = useRefresh(SCHOOL_PRINCIPAL);
  return (
    <TabScreen title={t('principal.schoolTitle')} refreshing={refreshing} onRefresh={refresh}>
      <QueryBoundary fallback={<SchoolSkeleton />}>
        <School />
      </QueryBoundary>
    </TabScreen>
  );
}

function SchoolSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton className="h-12" />
      <Skeleton className="h-[156px]" />
      <Skeleton className="h-[156px]" />
    </View>
  );
}

function School() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const segment: Segment = SEGMENTS.includes(params.tab as Segment) ? (params.tab as Segment) : 'teachers';
  const { school } = useSchool();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!school) return <EmptyState title={t('principal.noSchool')} body={t('principal.noSchoolBody')} illustration="classroom" />;
  return (
    <View>
      <View className={cn('mb-3', pickerOpen && 'z-30')}>
        <ReportSelect
          label={t('principal.school')}
          value={school.id}
          options={[{ value: school.id, label: school.name }]}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onChange={() => undefined}
        />
      </View>
      <SchoolTabs
        value={segment}
        onChange={(tab) => router.setParams({ tab })}
        options={SEGMENTS.map((value) => ({ value, label: t(`principal.${value}`) }))}
      />
      {segment === 'teachers' ? (
        <View className="gap-3">
          {teacherRows(school).map((row) => (
            <TeacherCard key={row.id} {...row} onOpen={() => router.push({ pathname: '/principal/teacher/[id]', params: { id: row.id } })} />
          ))}
          {school.teachers.length === 0 ? <EmptyState title={t('principal.noTeachers')} illustration="classroom" /> : null}
        </View>
      ) : (
        <ClassTable
          schoolName={school.name}
          classes={classRows(school)}
          onOpen={(id) => router.push({ pathname: '/principal/class/[id]', params: { id } })}
        />
      )}
    </View>
  );
}
