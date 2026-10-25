import { router, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ClassCard } from '@/features/classes/class-card';
import { Stat } from '@/features/reports/report-parts';
import { averageScore, isActiveTeacher, publishedWorks } from '@/features/school/school-data';
import { StaffAvatar } from '@/features/school/school-parts';
import { SCHOOL_PRINCIPAL } from '@/features/school/gql';
import { useSchool } from '@/features/school/use-school';
import { BackBar } from '@/ui/back-bar';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { StatusMark } from '@/ui/status-mark';
import { Text } from '@/ui/text';

/** A teacher of the school: activity numbers and their classes (each opens the read-only class page). */
export function PrincipalTeacherScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshing, refresh } = useRefresh(SCHOOL_PRINCIPAL);

  return (
    <View className="flex-1 bg-surface">
      <BackBar label={t('principal.schoolTitle')} fallback="/principal/school?tab=teachers" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <QueryBoundary
          fallback={
            <View className="gap-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-[200px]" />
            </View>
          }
        >
          <TeacherPage id={id} />
        </QueryBoundary>
      </ScrollView>
    </View>
  );
}

function TeacherPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const { school } = useSchool();
  const teacher = school?.teachers.find((x) => x.id === id);

  if (!teacher) return <EmptyState title={t('principal.noTeachers')} illustration="classroom" />;
  const works = publishedWorks(teacher.classes);
  const average = averageScore(teacher.classes);
  const active = isActiveTeacher(teacher);
  return (
    <View>
      <View className="mb-6 flex-row items-center gap-3">
        <StaffAvatar name={teacher.name} size={48} />
        <View className="flex-1">
          <Text className="mb-[3px] font-body-semibold text-[21px] leading-[28px]" numberOfLines={2}>{teacher.name}</Text>
          <Text className="font-body text-[12px] leading-[18px] text-subtle" numberOfLines={1}>
            {t('common.roles.teacher')} · {school?.name}
          </Text>
        </View>
        <StatusMark status={active ? 'done' : 'pending'} label={t(active ? 'principal.active' : 'principal.inactive')} size={16} />
      </View>
      <View className="gap-3">
        <View className="flex-row gap-3">
          <Stat label={t('principal.classes')} value={teacher.classes.length} />
          <Stat label={t('principal.students')} value={teacher.classes.reduce((n, c) => n + c.students.length, 0)} />
        </View>
        <View className="flex-row gap-3">
          <Stat label={t('principal.workAssigned')} value={works.length} />
          <Stat label={t('reports.averageScore')} value={average == null ? '—' : `${average}%`} />
        </View>
      </View>
      <Text className="mb-[14px] mt-6 font-body-semibold text-[17px] leading-[24px]">{t('principal.classes')}</Text>
      <View className="gap-3">
        {teacher.classes.map((c) => (
          <ClassCard
            key={c.id}
            name={c.name}
            studentCount={c.students.length}
            workCount={publishedWorks([c]).length}
            onPress={() => router.push({ pathname: '/principal/class/[id]', params: { id: c.id } })}
          />
        ))}
        {teacher.classes.length === 0 ? <EmptyState title={t('classes.noClasses')} illustration="classroom" /> : null}
      </View>
    </View>
  );
}
