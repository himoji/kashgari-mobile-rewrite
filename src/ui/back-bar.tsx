import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

/** The prototype's focused-page app bar: a back pill naming the parent section ("← Материалдар"). */
export function BackBar({ label, onBack, fallback, action }: { label: string; onBack?: () => void; fallback?: Href; action?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-row items-center justify-between gap-3 bg-surface px-5 pb-2.5" style={{ paddingTop: Math.max(insets.top, 30) + 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onBack ?? (() => goBack(fallback))}
        hitSlop={4}
        className="h-11 flex-row items-center gap-1.5 rounded-[24px] pl-2 pr-3 active:bg-canvas"
      >
        <Icon name="back" size={20} color={colors.ink} />
        <Text className="font-body-medium text-[12px] leading-[18px] text-body" numberOfLines={1}>{label}</Text>
      </Pressable>
      {action}
    </View>
  );
}
