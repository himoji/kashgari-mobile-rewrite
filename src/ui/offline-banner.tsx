import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toastIn, toastOut } from '@/lib/motion';
import { useOnline } from '@/lib/network';
import { Text } from '@/ui/text';

/** App-wide pill under the status bar while the device is offline. Touches pass through it. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ top: insets.top + 4 }}>
      <Animated.View
        entering={toastIn}
        exiting={toastOut}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 shadow-pill"
      >
        <View className="size-1.5 rounded-full bg-danger" />
        <Text variant="small" tone="inverse" maxFontSizeMultiplier={1.3}>
          {t('common.states.offline')}
        </Text>
      </Animated.View>
    </View>
  );
}
