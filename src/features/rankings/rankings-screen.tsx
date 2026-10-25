import { useSuspenseQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { RANKINGS_CLASSES, RANKINGS_CLASSMATES } from '@/features/rankings/gql';
import { Podium } from '@/features/rankings/podium';
import { classRows, rankRows, type RankRow } from '@/features/rankings/rank';
import { cn } from '@/ui/cn';
import { EmptyState, NotReady, Skeleton } from '@/ui/feedback';
import { IconButton } from '@/ui/icon-button';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

type Tab = 'schools' | 'classes' | 'students';
const TABS: Tab[] = ['schools', 'classes', 'students'];

function Tabs({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="tablist"
      className="mb-3.5 flex-row gap-1 rounded-control bg-[#f0f5fd] p-1"
    >
      {TABS.map((tab) => {
        const selected = tab === value;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            className={cn(
              'h-11 flex-1 items-center justify-center rounded-[9px] p-2',
              selected && 'sheen bg-primary-strong',
            )}
            style={selected ? { boxShadow: '0 2px 6px rgba(10, 116, 255, 0.094)' } : undefined}
          >
            <Text
              className={cn(
                'font-body text-[12px] leading-[18px]',
                selected ? 'text-white' : 'text-muted',
              )}
              numberOfLines={1}
            >
              {t(`rankings.tabs.${tab}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OwnSummary({ tab, own, total }: { tab: Tab; own: RankRow; total: number }) {
  const { t } = useTranslation();
  return (
    <View className="sheen mb-[26px] flex-row items-center gap-[15px] rounded-[16px] bg-primary p-4">
      <View className="flex-1 gap-[5px]">
        <Text className="font-body text-[12px] leading-[19px] text-white">
          {t(`rankings.own.${tab}`)}
        </Text>
        <Text className="font-body-medium text-[14px] leading-[22px] text-white" numberOfLines={1}>
          {own.name}
        </Text>
      </View>
      <Text className="font-body-bold text-[26px] leading-[34px] text-white">
        {own.rank}
        <Text className="font-body text-[13px] text-white"> / {total}</Text>
      </Text>
    </View>
  );
}

function RankList({ rows }: { rows: RankRow[] }) {
  const { t } = useTranslation();
  return (
    <>
      <View className="mx-0.5 mb-2.5 flex-row items-center justify-between gap-3">
        <Text className="font-body-semibold text-[17px] leading-[24px]">
          {t('rankings.allPlaces')}
        </Text>
        <Text className="font-body text-[12px] leading-[18px] text-subtle">
          {t('rankings.points')}
        </Text>
      </View>
      <View className="gap-[5px]">
        {rows.map((r) => (
          <View
            key={r.id}
            accessibilityState={{ selected: r.own }}
            className={cn(
              'min-h-[66px] flex-row items-center gap-3 rounded-control px-[9px] py-3',
              r.own && 'bg-[#e7f0ff]',
            )}
          >
            <Text className="w-[25px] text-center font-body text-[15px] leading-[22.5px] text-subtle">
              {r.rank}
            </Text>
            <View className="flex-1 items-center">
              <Text
                className="text-center font-body-medium text-[14px] leading-[21px] text-link"
                numberOfLines={1}
              >
                {r.name}
              </Text>
              {r.own ? (
                <Text className="font-body text-[11px] leading-[17px] text-primary">
                  {t('rankings.you')}
                </Text>
              ) : null}
            </View>
            <Text className="font-body-bold text-[15px] leading-[22.5px] text-primary">
              {r.score}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function RankingSkeleton() {
  return (
    <View className="gap-3 pt-5">
      <Skeleton className="h-56" />
      <Skeleton className="h-20" />
      <Skeleton className="h-16" />
    </View>
  );
}

function Ranking({ tab, rows }: { tab: Tab; rows: RankRow[] }) {
  const { t } = useTranslation();
  if (!rows.length) return <EmptyState title={t('rankings.empty')} illustration="progress" />;
  const own = rows.find((r) => r.own);
  return (
    <>
      <Podium rows={rows} />
      {own ? <OwnSummary tab={tab} own={own} total={rows.length} /> : null}
      <RankList rows={rows} />
    </>
  );
}

function Classmates() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RANKINGS_CLASSMATES, {
    variables: { studentId: profileId },
    queryKey,
  });
  const rows = useMemo(
    () =>
      rankRows(
        (data.student?.class.students ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          score: s.acorns,
          own: s.id === profileId,
        })),
      ),
    [data, profileId],
  );
  return <Ranking tab="students" rows={rows} />;
}

function SchoolClasses() {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(RANKINGS_CLASSES, {
    variables: { studentId: profileId },
    queryKey,
  });
  const own = data.student?.class;
  const rows = useMemo(() => classRows(own?.teacher.school?.teachers ?? [], own?.id), [own]);
  return <Ranking tab="classes" rows={rows} />;
}

/** League rankings by acorns: classes of the school and classmates. The regional school ranking has no backend. */
export function RankingsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('students');
  return (
    <TabScreen
      title={t('rankings.title')}
      mascot="learning"
      actions={
        <View className="flex-1 flex-row">
          <IconButton
            icon="back"
            tone="glass"
            label={t('common.actions.back')}
            onPress={() => router.back()}
          />
        </View>
      }
    >
      <View>
        <Tabs value={tab} onChange={setTab} />
        {tab === 'schools' ? (
          <>
            <View className="mx-0.5 mb-2.5 mt-5 gap-[5px]">
              <Text className="font-body-semibold text-[16px] leading-[23px]">
                {t('rankings.scope')}
              </Text>
              <Text className="font-body text-[12px] leading-[19px] text-subtle">
                {t('rankings.prizes')}
              </Text>
            </View>
            <NotReady body={t('rankings.schoolsNotReady')} className="mt-3" />
          </>
        ) : (
          // Keyed by tab, so a failed tab does not keep its error state on the other one.
          <QueryBoundary key={tab} fallback={<RankingSkeleton />}>
            {tab === 'classes' ? <SchoolClasses /> : <Classmates />}
          </QueryBoundary>
        )}
      </View>
    </TabScreen>
  );
}
