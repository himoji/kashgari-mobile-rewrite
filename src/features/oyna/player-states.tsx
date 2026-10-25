import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PlayerFrame } from '@/features/oyna/player-frame';
import { ErrorState, Skeleton } from '@/ui/feedback';

export function PlayerLoading() {
  return (
    <PlayerFrame title="">
      <View className="gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-[180px]" />
        <Skeleton className="h-11" />
      </View>
    </PlayerFrame>
  );
}

export function PlayerError({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useTranslation();
  return (
    <PlayerFrame title={t('oyna.title')}>
      <ErrorState onRetry={onRetry} message={message} />
    </PlayerFrame>
  );
}
