import { router } from 'expo-router';
import { Hourglass } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { STUDENT_ASSIGNMENTS } from '@/features/assignments/gql';
import { assignmentHref } from '@/features/assignments/routes';
import { useStudentAssignments } from '@/features/assignments/use-student-assignments';
import { useProfile } from '@/features/auth/session';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Card } from '@/ui/card';
import { Skeleton } from '@/ui/feedback';
import { ListRow } from '@/ui/list-row';
import { ProgressRing } from '@/ui/progress-ring';
import { QueryBoundary, useRefresh } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

/** The design's blue "Күн сөзі" card. The API has no word of the day yet, so the card says it is coming soon. */
function DailyWordCard() {
  const { t } = useTranslation();
  return (
    <View className="sheen mb-[18px] gap-[3px] rounded-[18px] bg-primary p-3">
      <Text className="font-body-medium text-[11px] leading-[16px] text-white">{t('studentHome.dailyWord')}</Text>
      <View className="flex-row items-center gap-2.5">
        <Hourglass size={18} color={colors.white} />
        <Text className="font-body-semibold text-[22px] leading-[28px] text-white">{t('common.notReady.title')}</Text>
      </View>
      <Text className="font-body text-[11px] leading-[17px] text-white">{t('common.notReady.body')}</Text>
    </View>
  );
}

function ProgressCard({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation();
  return (
    <Card variant="blue" className="flex-row items-center gap-2">
      <View className="flex-1">
        <Text className="font-body-medium text-[38px] leading-[43px] text-white">
          {done}
          <Text className="font-body text-[22px] leading-[43px] text-white"> / {total}</Text>
        </Text>
        <Text className="mb-3 mt-1.5 font-body text-[12px] leading-[18px] text-white/95">{t('studentHome.completed')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/student/results')}
          className="min-h-[37px] self-start justify-center rounded-[11px] bg-white px-[14px] py-2 active:opacity-90"
          style={{ boxShadow: 'inset 0 1px 3px rgba(109,160,230,0.44), 0 2px 5px rgba(22,88,180,0.07)' }}
        >
          <Text className="font-body-semibold text-[12px] leading-[18px] text-link">{t('studentHome.results')}</Text>
        </Pressable>
      </View>
      <View className="h-[108px] w-[108px] items-center justify-center">
        <ProgressRing value={total ? done / total : 0} size={98} stroke={10} track="rgba(255,255,255,0.25)" label={t('studentHome.completion')} />
      </View>
    </Card>
  );
}

function ReadingRow() {
  const { t } = useTranslation();
  return (
    <ListRow
      icon="solid-book"
      title={t('studentHome.continueReading')}
      subtitle={t('studentHome.readingHint')}
      onPress={() => router.push('/student/league')}
    />
  );
}

function WordsRow() {
  const { t } = useTranslation();
  return (
    <ListRow
      icon="solid-star"
      title={t('studentHome.reviewWords')}
      subtitle={t('studentHome.reviewWordsHint')}
      onPress={() => router.push('/student/words')}
    />
  );
}

/** Student Home: greeting, word of the day, progress on school work and quick ways back into learning. */
export function StudentHomeScreen() {
  const { t } = useTranslation();
  const { name } = useProfile();
  const { refreshing, refresh } = useRefresh(STUDENT_ASSIGNMENTS);
  const firstName = name.split(' ')[0] ?? name;

  return (
    <TabScreen title={`${t('studentHome.hello')}\n${firstName}!`} mascot="home" refreshing={refreshing} onRefresh={refresh}>
      <DailyWordCard />
      <QueryBoundary
        fallback={
          <>
            <Skeleton className="h-[156px] rounded-[20px]" />
            <ReadingRow />
            <WordsRow />
          </>
        }
      >
        <Progress />
      </QueryBoundary>
    </TabScreen>
  );
}

/** The progress card and the next school task sit between the static rows, so they share one boundary. */
function Progress() {
  const { t } = useTranslation();
  const content = useContentText();
  const { all, fresh, completed } = useStudentAssignments();
  const next = fresh[0];
  return (
    <>
      {all.length > 0 ? <ProgressCard done={completed.length} total={all.length} /> : null}
      <ReadingRow />
      {next ? (
        <ListRow
          icon="solid-classes"
          title={t('studentHome.schoolTask')}
          subtitle={content(next.title)}
          onPress={() => router.push(assignmentHref(next))}
        />
      ) : null}
      <WordsRow />
    </>
  );
}
