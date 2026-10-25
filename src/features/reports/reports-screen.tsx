import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { dayMonth } from '@/features/classes/format';
import { TEACHER_REPORTS } from '@/features/reports/gql';
import { activityBuckets, PERIODS, periodStart, type Period } from '@/features/reports/period';
import { pointsPercent, workReport } from '@/features/reports/report-data';
import { Bars, ModuleUsage, Panel, ReportSelect, Stat } from '@/features/reports/report-parts';
import { ALL_CLASSES, useSchoolFilters } from '@/features/teacher-assignments/filters';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { ErrorState, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

function MemberRow({ label, value }: { label: string; value: number | string }) {
  return (
    <View className="flex-row items-center gap-4 py-[18px]">
      <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#b8eedb]">
        <Icon name="solid-people" size={20} color={colors.ink} />
      </View>
      <Text className="flex-1 font-body text-[16px] leading-[24px]">{label}</Text>
      <Text className="font-body-semibold text-[20px] leading-[26px]">{value}</Text>
    </View>
  );
}

/** Teacher "Есептер": period and class filters, KPI tiles, module usage, class performance, app activity, members. */
export function ReportsScreen() {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const school = useTeacherSchool();
  const [period, setPeriod] = useState<Period>('month');
  const [openSelect, setOpenSelect] = useState<'period' | 'class' | null>(null);
  const classFilter = useSchoolFilters((s) => s.classFilter.reports);
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);

  const after = periodStart(period);
  const shownClasses = useMemo(
    () => school.classes.filter((c) => classFilter === ALL_CLASSES || c.id === classFilter),
    [school.classes, classFilter],
  );
  const report = useMemo(() => workReport(shownClasses, after), [shownClasses, after]);
  const buckets = useMemo(() => activityBuckets(period), [period]);

  const base = { teacherId: profileId, ...(after != null ? { after } : {}), ...(classFilter !== ALL_CLASSES ? { classId: classFilter } : {}) };
  const stats = useQuery(TEACHER_REPORTS, {
    skip: school.loading,
    variables: {
      points: [base],
      classPoints: shownClasses.map((c) => ({ ...base, classId: c.id })),
      clicks: buckets.map((b) => ({ ...base, after: b.after, before: b.before })),
      members: [school.schoolId ? { schoolId: school.schoolId } : { teacherId: profileId }],
    },
  });
  const average = pointsPercent(stats.data?.statsPoints[0]);
  const classAverages = shownClasses.map((c, i) => ({ label: c.name, value: pointsPercent(stats.data?.classPoints[i]) ?? 0 }));
  const clicks = buckets.map((b, i) => ({ label: dayMonth(b.before), value: stats.data?.statsClicks[i]?.clicks ?? 0 }));
  const maxClicks = Math.max(1, ...clicks.map((c) => c.value));
  const members = stats.data?.statsMembers[0];
  const loading = school.loading || (stats.loading && !stats.data);

  return (
    <TabScreen
      title={t('reports.title')}
      actions={<IconButton icon="back" tone="glass" label={t('reports.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
      refreshing={false}
      onRefresh={() => {
        void school.refetch();
        void stats.refetch();
      }}
    >
      <View>
        <View className={cn('mb-[14px]', openSelect === 'period' && 'z-20')}>
          <ReportSelect
            label={t('reports.period')}
            value={period}
            options={PERIODS.map((p) => ({ value: p, label: t(`reports.periods.${p}`) }))}
            open={openSelect === 'period'}
            onOpenChange={(o) => setOpenSelect(o ? 'period' : null)}
            onChange={setPeriod}
          />
        </View>
        <View className={cn('mb-[14px] gap-1.5', openSelect === 'class' && 'z-20')}>
          <Text className="font-body-semibold text-[14px] leading-[21px] text-meta">{t('reports.class')}</Text>
          <ReportSelect
            label={t('reports.class')}
            value={classFilter}
            options={[{ value: ALL_CLASSES, label: t('reports.allClasses') }, ...school.classes.map((c) => ({ value: c.id, label: c.name }))]}
            open={openSelect === 'class'}
            onOpenChange={(o) => setOpenSelect(o ? 'class' : null)}
            onChange={(id) => setClassFilter('reports', id)}
          />
        </View>

        {school.error && !school.classes.length ? (
          <ErrorState onRetry={() => void school.refetch()} />
        ) : loading ? (
          <View className="gap-3">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[318px]" />
          </View>
        ) : (
          <View>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Stat label={t('reports.activeStudents')} value={report.activeStudents} />
                <Stat label={t('reports.workAssigned')} value={report.workAssigned} />
              </View>
              <View className="flex-row gap-3">
                <Stat label={t('reports.averageScore')} value={average == null ? '—' : `${average}%`} />
                <Stat label={t('reports.submissions')} value={report.submissions} />
              </View>
            </View>

            <View className="mt-[18px] gap-3">
              <ModuleUsage modules={report.modules} />
              <Panel title={t('reports.schoolPerformance')}>
                <Bars points={classAverages.map((c) => ({ ...c, text: `${c.value}%` }))} highlightFirst scale={1.6} />
              </Panel>
            </View>

            <View className="mt-[18px]">
              <Text className="mb-2.5 font-body-semibold text-[16px] leading-[20.8px]">{t('reports.engagement')}</Text>
              <View className="gap-3">
                <Panel title={t('reports.appClicks')}>
                  <Bars points={clicks.map((c) => ({ ...c, text: String(c.value) }))} scale={130 / maxClicks} />
                  <Text className="mt-1 font-body text-[14px] leading-[21px] text-body">{t('reports.appClicksHint')}</Text>
                </Panel>
                <Panel title={t('reports.members')}>
                  <MemberRow label={t('reports.students')} value={members?.students ?? '—'} />
                  <MemberRow label={t('reports.teachers')} value={members?.teachers ?? '—'} />
                  <Text className="mb-3 font-body text-[14px] leading-[21px] text-body">{t('reports.memberHint')}</Text>
                </Panel>
              </View>
            </View>
          </View>
        )}
      </View>
    </TabScreen>
  );
}
