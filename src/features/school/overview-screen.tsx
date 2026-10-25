import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { PERIODS, periodStart, type Period } from '@/features/reports/period';
import { pointsPercent, workReport } from '@/features/reports/report-data';
import { Bars, ModuleUsage, Panel, ReportSelect, Stat } from '@/features/reports/report-parts';
import { SCHOOL_STATS } from '@/features/school/gql';
import { ClassTable, SectionHead, TeacherCard } from '@/features/school/school-parts';
import { classRows, teacherActivity, teacherRows } from '@/features/school/school-data';
import { useSchool } from '@/features/school/use-school';
import { cn } from '@/ui/cn';
import { ErrorState, Skeleton } from '@/ui/feedback';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

/** Principal home: school and period pickers, KPI tiles, module usage, teacher activity, teachers and classes. */
export function PrincipalOverviewScreen() {
  const { t } = useTranslation();
  const { name } = useProfile();
  const { school, loading, error, refreshing, refetch } = useSchool();
  const [period, setPeriod] = useState<Period>('month');
  const [openSelect, setOpenSelect] = useState<'school' | 'period' | null>(null);
  const after = periodStart(period);

  const stats = useQuery(SCHOOL_STATS, {
    skip: !school,
    variables: {
      points: [{ schoolId: school?.id, ...(after != null ? { after } : {}) }],
      members: [{ schoolId: school?.id }],
    },
  });
  const report = useMemo(() => workReport(school?.classes ?? [], after), [school, after]);
  const activity = useMemo(() => (school ? teacherActivity(school.teachers, after) : []), [school, after]);
  const maxActivity = Math.max(1, ...activity.map((a) => a.count));
  const average = pointsPercent(stats.data?.statsPoints[0]);
  const members = stats.data?.statsMembers[0];
  const openClass = (id: string) => router.push({ pathname: '/principal/class/[id]', params: { id } });
  const openTeacher = (id: string) => router.push({ pathname: '/principal/teacher/[id]', params: { id } });

  return (
    <TabScreen
      title={t('principal.hello', { name: name.split(' ')[0] ?? name })}
      refreshing={refreshing}
      onRefresh={() => {
        refetch();
        void stats.refetch();
      }}
    >
      {loading ? (
        <View className="gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[318px]" />
        </View>
      ) : error || !school ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <View>
          <View className={cn('mb-3', openSelect === 'school' && 'z-30')}>
            <ReportSelect
              label={t('principal.school')}
              value={school.id}
              options={[{ value: school.id, label: school.name }]}
              open={openSelect === 'school'}
              onOpenChange={(o) => setOpenSelect(o ? 'school' : null)}
              onChange={() => undefined}
            />
          </View>
          <View className={cn('mb-5 mt-1', openSelect === 'period' && 'z-30')}>
            <Text className="font-body-semibold text-[26px] leading-[31.2px]">{t('principal.greeting')}</Text>
            <View className="mt-[14px]">
              <ReportSelect
                label={t('reports.period')}
                value={period}
                options={PERIODS.map((p) => ({ value: p, label: t(`reports.periods.${p}`) }))}
                open={openSelect === 'period'}
                onOpenChange={(o) => setOpenSelect(o ? 'period' : null)}
                onChange={setPeriod}
              />
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-3">
              <Stat label={t('principal.students')} value={members?.students ?? '—'} />
              <Stat label={t('principal.teachers')} value={members?.teachers ?? school.teachers.length} />
            </View>
            <View className="flex-row gap-3">
              <Stat label={t('reports.averageScore')} value={average == null ? '—' : `${average}%`} />
              <Stat label={t('reports.submissions')} value={report.submissions} />
            </View>
          </View>

          <View className="mt-[18px]">
            <SectionHead title={t('reports.schoolPerformance')} onViewAll={() => router.navigate({ pathname: '/principal/school', params: { tab: 'classes' } })} />
            <View className="gap-3">
              <ModuleUsage modules={report.modules} />
              <Panel title={t('principal.teacherActivity')}>
                {activity.length ? (
                  <Bars
                    points={activity.map((a) => ({ label: a.name.split(' ')[0] ?? a.name, value: a.count, text: String(a.count) }))}
                    highlightFirst
                    scale={129 / maxActivity}
                  />
                ) : (
                  <Text className="mt-3 font-body text-[14px] text-body">{t('common.states.empty')}</Text>
                )}
              </Panel>
            </View>
          </View>

          <View className="mt-[18px]">
            <SectionHead title={t('principal.teachers')} onViewAll={() => router.navigate({ pathname: '/principal/school', params: { tab: 'teachers' } })} />
            <View className="gap-3">
              {teacherRows(school).map((row) => (
                <TeacherCard key={row.id} {...row} onOpen={() => openTeacher(row.id)} />
              ))}
            </View>
          </View>

          <View className="mt-[18px]">
            <SectionHead title={t('principal.classes')} />
            <ClassTable schoolName={school.name} classes={classRows(school)} onOpen={openClass} />
          </View>
        </View>
      )}
    </TabScreen>
  );
}
