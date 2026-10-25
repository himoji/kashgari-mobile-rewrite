import { useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { TEACHER_HOME } from '@/features/teacher-home/gql';
import { countAwaitingReview, firstName } from '@/features/teacher-home/review-count';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

const art = {
  assign: require('@/assets/images/actions/assign.webp'),
  review: require('@/assets/images/actions/review.webp'),
  classes: require('@/assets/images/actions/classes.webp'),
};

function ActionCard({ image, title, hint, href }: { image: keyof typeof art; title: string; hint?: string; href: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      className="min-h-[88px] flex-row items-center gap-[13px] rounded-card bg-surface px-[14px] py-4 active:opacity-80"
      style={{ boxShadow: '0 4px 14px rgba(36,38,49,0.067), 0 1px 3px rgba(36,38,49,0.024)' }}
    >
      <Image source={art[image]} style={{ width: 48, height: 48 }} contentFit="contain" />
      <View className="flex-1">
        <Text variant="strong">{title}</Text>
        {hint ? <Text className="mt-1 font-body text-[11px] leading-[16px] text-subtle">{hint}</Text> : null}
      </View>
      <Icon name="arrow" size={17} color={colors.ink} />
    </Pressable>
  );
}

/** Teacher home: greeting and the three everyday jobs (assign, review, grades). */
export function TeacherHomeScreen() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { data, refetch, networkStatus } = useQuery(TEACHER_HOME, { variables: { teacherId: profile.profileId }, notifyOnNetworkStatusChange: true });
  const awaiting = data?.teacher ? countAwaitingReview(data.teacher) : null;

  return (
    <TabScreen
      title={t('teacherHome.greeting', { name: firstName(data?.teacher?.name ?? profile.name) })}
      refreshing={networkStatus === 4}
      onRefresh={() => void refetch()}
    >
      <ActionCard image="assign" title={t('teacherHome.assign')} href="/teacher/assign/new" />
      <ActionCard
        image="review"
        title={t('teacherHome.review')}
        hint={awaiting == null ? undefined : awaiting ? t('teacherHome.answers', { count: awaiting }) : t('teacherHome.noAnswers')}
        href={{ pathname: '/teacher/school', params: { tab: 'review' } }}
      />
      <ActionCard image="classes" title={t('teacherHome.grades')} href={{ pathname: '/teacher/school', params: { tab: 'classes' } }} />
    </TabScreen>
  );
}
