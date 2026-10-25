import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

const illustrations = {
  materials: require('@/assets/images/illustrations/materials.webp'),
  progress: require('@/assets/images/illustrations/progress.webp'),
  classroom: require('@/assets/images/illustrations/classroom.webp'),
  nature: require('@/assets/images/illustrations/nature.webp'),
  city: require('@/assets/images/illustrations/city.webp'),
  grammar: require('@/assets/images/illustrations/grammar.webp'),
  culture: require('@/assets/images/illustrations/culture.webp'),
};
export type Illustration = keyof typeof illustrations;

export function EmptyState({ title, body, illustration = 'materials' }: { title: string; body?: string; illustration?: Illustration }) {
  return (
    <View className="items-center gap-2 px-6 py-10">
      <Image source={illustrations[illustration]} style={{ width: 180, height: 120 }} contentFit="contain" />
      <Text variant="heading" className="text-center">{title}</Text>
      {body ? <Text variant="caption" className="text-center">{body}</Text> : null}
    </View>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-3 px-6 py-10">
      <Text variant="heading" className="text-center">{message ?? t('common.states.error')}</Text>
      {onRetry ? <Button variant="secondary" label={t('common.actions.retry')} onPress={onRetry} /> : null}
    </View>
  );
}

/** Marks a design feature the backend cannot serve yet. */
export function NotReady({ title, body, className }: { title?: string; body?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <Card variant="muted" className={cn('flex-row items-center gap-3 border border-dashed border-field', className)}>
      <Icon name="hourglass" size={20} color={colors.subtle} />
      <View className="flex-1">
        <Text variant="strong" tone="muted">{title ?? t('common.notReady.title')}</Text>
        <Text variant="caption">{body ?? t('common.notReady.body')}</Text>
      </View>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <View className={cn('animate-pulse rounded-card bg-line', className)} />;
}

/** Default Suspense fallback for a tab: hero-shaped block plus three rows. */
export function ScreenSkeleton() {
  return (
    <View className="flex-1 gap-3 bg-canvas px-4 pt-24">
      <Skeleton className="h-32" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </View>
  );
}
