import { skipToken, useSuspenseQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { BookCover } from '@/features/league/book-cover';
import { LEAGUE_BOOKS, LEAGUE_STUDENT } from '@/features/league/gql';
import { paginate } from '@/features/reader/book';
import type { Level } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { EmptyState, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { QueryBoundary, useRefresh, useRetryKey } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

// Free texts are grouped by `complexity` (1 = easiest); we offer the ones matching the account level.
const COMPLEXITY: Record<Level, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };

function PointsCard({ points }: { points: number | null }) {
  const { t } = useTranslation();
  return (
    <View
      className="sheen min-h-[88px] flex-row items-center justify-between gap-3 rounded-[20px] bg-primary px-4 py-[18px]"
      style={{ boxShadow: '0 3px 12px rgba(52, 125, 233, 0.11)' }}
    >
      <View className="flex-row items-baseline gap-1.5">
        <Text className="font-body-medium text-[34px] leading-[40px] text-white">
          {points ?? '–'}
        </Text>
        <Text className="font-body text-[12px] leading-[18px] text-white">
          {t('league.points')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/student/rankings')}
        className="h-10 flex-row items-center justify-center gap-[7px] rounded-[11px] bg-surface px-[13px] active:opacity-80"
        style={{
          boxShadow: 'inset 0 1px 3px rgba(109, 160, 230, 0.44), 0 2px 5px rgba(22, 88, 180, 0.07)',
        }}
      >
        <Text className="font-body-medium text-[12px] leading-[18px] text-link">
          {t('league.rankings')}
        </Text>
        <Icon name="arrow" size={16} color={colors.link} />
      </Pressable>
    </View>
  );
}

function BookRow({ id, title, pages }: { id: string; title: string; pages: number }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/student/read/[id]', params: { id } })}
      className="min-h-[98px] flex-row items-center gap-[13px] rounded-card px-1.5 py-3.5 active:bg-canvas"
    >
      <BookCover id={id} />
      <View className="flex-1">
        <Text className="mb-[5px] font-body-semibold text-[14px] leading-[21px]" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption">{t('league.pages', { count: pages })}</Text>
      </View>
      <Icon name="arrow" size={17} color={colors.ink} />
    </Pressable>
  );
}

/** League tab: league points (acorns), the way to the rankings, and free texts to read. */
export function LeagueScreen() {
  const { t } = useTranslation();
  const { refreshing, refresh } = useRefresh(LEAGUE_STUDENT, LEAGUE_BOOKS);
  return (
    <TabScreen title={t('league.title')} mascot="learning" refreshing={refreshing} onRefresh={refresh}>
      <QueryBoundary fallback={<LeagueSkeleton />}>
        <League />
      </QueryBoundary>
    </TabScreen>
  );
}

function LeagueSkeleton() {
  return (
    <View>
      <PointsCard points={null} />
      <View className="mt-[18px] gap-1.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[84px]" />
        ))}
      </View>
    </View>
  );
}

function League() {
  const { t } = useTranslation();
  const profile = useProfile();
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data: student } = useSuspenseQuery(LEAGUE_STUDENT, { variables: { studentId: profile.profileId }, queryKey });
  const level = student.student?.account.languageLevel;
  const { data: books } = useSuspenseQuery(LEAGUE_BOOKS, level ? { variables: { complexity: COMPLEXITY[level] }, queryKey } : skipToken);

  const list = useMemo(
    () =>
      (books?.oqylymTextsByComplexity ?? []).map((b) => ({
        id: b.id,
        title: content(b.title),
        pages: paginate(b.paragraphs).length,
      })),
    [books, content],
  );

  return (
    <View>
      <PointsCard points={student.student?.acorns ?? null} />
      <View className="mt-[18px] gap-1.5">
        {list.length ? (
          list.map((b) => <BookRow key={b.id} {...b} />)
        ) : (
          <EmptyState title={t('league.emptyTitle')} body={t('league.emptyBody')} illustration="materials" />
        )}
      </View>
    </View>
  );
}
