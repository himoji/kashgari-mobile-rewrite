import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { PERIODS, periodStart, type Period } from '@/features/reports/period';
import { pointsPercent, workReport } from '@/features/reports/report-data';
import { Bars, ModuleUsage, Panel, ReportSelect, Stat } from '@/features/reports/report-parts';
import { SCHOOL_PRINCIPAL, SCHOOL_STATS } from '@/features/school/gql';
import { ClassTable, SectionHead, TeacherCard } from '@/features/school/school-parts';
import { classRows, teacherActivity, teacherRows } from '@/features/school/school-data';
import { useSchool } from '@/features/school/use-school';
import { cn } from '@/ui/cn';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

/** Home shows the first few teachers and classes; the School tab has the full lists. */
const PREVIEW = 3;

/** Principal home: school and period pickers, KPI tiles, module usage, teacher activity, teachers and classes. */
export function PrincipalOverviewScreen() {
  const { t } = useTranslation();
  const { name } = useProfile();
  const { refreshing, refresh } = useRefresh(SCHOOL_PRINCIPAL, SCHOOL_STATS);
  return (
    <TabScreen title={t('principal.hello', { name: name.split(' ')[0] ?? name })} refreshing={refreshing} onRefresh={refresh}>
      <QueryBoundary fallback={<OverviewSkeleton />}>
        <Overview />
      </QueryBoundary>
    </TabScreen>
  );
}

function OverviewSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton className="h-12" />
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[318px]" />
    </View>
  );
}

function Overview() {
  const { t } = useTranslation();
  const { school } = useSchool();
  const [period, setPeriod] = useState<Period>('month');
  const [openSelect, setOpenSelect] = useState<'school' | 'period' | null>(null);
  const after = periodStart(period);

  // Stats are extra: they never block the overview, and a failed request just shows "–" in the tiles.
  const { data: stats } = useQuery(SCHOOL_STATS, {
    variables: {
      points: [{ schoolId: school?.id ?? '', ...(after != null ? { after } : {}) }],
      members: [{ schoolId: school?.id ?? '' }],
    },
    skip: !school,
  });
  const report = useMemo(() => workReport(school?.classes ?? [], after), [school, after]);
  const activity = useMemo(() => (school ? teacherActivity(school.teachers, after) : []), [school, after]);
  const maxActivity = Math.max(1, ...activity.map((a) => a.count));
  const average = pointsPercent(stats?.statsPoints[0]);
  const members = stats?.statsMembers[0];
  const openClass = (id: string) => router.push({ pathname: '/principal/class/[id]', params: { id } });
  const openTeacher = (id: string) => router.push({ pathname: '/principal/teacher/[id]', params: { id } });

  if (!school) return <EmptyState title={t('principal.noSchool')} body={t('principal.noSchoolBody')} illustration="classroom" />;
  return (
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
          {teacherRows(school, undefined, after).slice(0, PREVIEW).map((row) => (
            <TeacherCard key={row.id} {...row} onOpen={() => openTeacher(row.id)} />
          ))}
        </View>
      </View>

      <View className="mt-[18px]">
        <SectionHead title={t('principal.classes')} onViewAll={() => router.navigate({ pathname: '/principal/school', params: { tab: 'classes' } })} />
        <ClassTable schoolName={school.name} classes={classRows(school, after).slice(0, PREVIEW)} onOpen={openClass} />
      </View>
    </View>
  );
}
