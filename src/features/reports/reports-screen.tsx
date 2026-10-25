import { useSuspenseQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { dayMonth } from '@/features/classes/format';
import { TEACHER_REPORTS } from '@/features/reports/gql';
import { activityBuckets, PERIODS, periodStart, type Period } from '@/features/reports/period';
import { pointsPercent, workReport } from '@/features/reports/report-data';
import { Bars, ModuleUsage, Panel, ReportSelect, Stat } from '@/features/reports/report-parts';
import type { ClassWork } from '@/features/classes/class-data';
import { ALL_CLASSES, useSchoolFilters } from '@/features/teacher-assignments/filters';
import { TEACHER_SCHOOL } from '@/features/teacher-assignments/gql';
import { useTeacherSchool } from '@/features/teacher-assignments/use-teacher-school';
import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { QueryBoundary, useRetryKey, useRefresh } from '@/ui/query-boundary';
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
  const [period, setPeriod] = useState<Period>('month');
  const [openSelect, setOpenSelect] = useState<'period' | 'class' | null>(null);
  const { refreshing, refresh } = useRefresh(TEACHER_SCHOOL, TEACHER_REPORTS);
  // Time-based variables are fixed here, outside the boundaries: a suspended render throws its memos
  // away, so computing "now" inside would give new variables (and a new request) on every attempt.
  const after = useMemo(() => periodStart(period), [period]);
  const buckets = useMemo(() => activityBuckets(period), [period]);
  const filters = { period, setPeriod, openSelect, setOpenSelect };

  return (
    <TabScreen
      title={t('reports.title')}
      actions={<IconButton icon="back" tone="glass" label={t('reports.back')} onPress={() => goBack()} />}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <QueryBoundary
        fallback={
          <View>
            <ReportFilters {...filters} classes={[]} />
            <StatsSkeleton />
          </View>
        }
      >
        <Reports filters={filters} after={after} buckets={buckets} />
      </QueryBoundary>
    </TabScreen>
  );
}

type Filters = {
  period: Period;
  setPeriod: (period: Period) => void;
  openSelect: 'period' | 'class' | null;
  setOpenSelect: (open: 'period' | 'class' | null) => void;
};

function ReportFilters({ period, setPeriod, openSelect, setOpenSelect, classes }: Filters & { classes: ClassWork[] }) {
  const { t } = useTranslation();
  const classFilter = useSchoolFilters((s) => s.classFilter.reports);
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);
  return (
    <>
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
          options={[{ value: ALL_CLASSES, label: t('reports.allClasses') }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
          open={openSelect === 'class'}
          onOpenChange={(o) => setOpenSelect(o ? 'class' : null)}
          onChange={(id) => setClassFilter('reports', id)}
        />
      </View>
    </>
  );
}

function StatsSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[318px]" />
    </View>
  );
}

type Buckets = ReturnType<typeof activityBuckets>;

function Reports({ filters, after, buckets }: { filters: Filters; after: number | null; buckets: Buckets }) {
  const school = useTeacherSchool();
  return (
    <View>
      <ReportFilters {...filters} classes={school.classes} />
      <QueryBoundary fallback={<StatsSkeleton />}>
        <ReportStats classes={school.classes} schoolId={school.schoolId} after={after} buckets={buckets} />
      </QueryBoundary>
    </View>
  );
}

function ReportStats({ classes, schoolId, after, buckets }: { classes: ClassWork[]; schoolId: string | null; after: number | null; buckets: Buckets }) {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const classFilter = useSchoolFilters((s) => s.classFilter.reports);
  const shownClasses = useMemo(
    () => classes.filter((c) => classFilter === ALL_CLASSES || c.id === classFilter),
    [classes, classFilter],
  );
  const report = useMemo(() => workReport(shownClasses, after), [shownClasses, after]);

  const base = { teacherId: profileId, ...(after != null ? { after } : {}), ...(classFilter !== ALL_CLASSES ? { classId: classFilter } : {}) };
  const { data } = useSuspenseQuery(TEACHER_REPORTS, {
    variables: {
      points: [base],
      classPoints: shownClasses.map((c) => ({ ...base, classId: c.id })),
      clicks: buckets.map((b) => ({ ...base, after: b.after, before: b.before })),
      members: [schoolId ? { schoolId } : { teacherId: profileId }],
    },
    queryKey,
  });
  const average = pointsPercent(data.statsPoints[0]);
  const classAverages = shownClasses.map((c, i) => ({ label: c.name, value: pointsPercent(data.classPoints[i]) ?? 0 }));
  const clicks = buckets.map((b, i) => ({ label: dayMonth(b.before), value: data.statsClicks[i]?.clicks ?? 0 }));
  const maxClicks = Math.max(1, ...clicks.map((c) => c.value));
  const members = data.statsMembers[0];

  return (
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
  );
}
