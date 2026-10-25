import type { ReactNode } from 'react';
import { View } from 'react-native';

import { colors } from '@/theme/colors';
import { Card, PressableCard } from '@/ui/card';
import { Icon, type IconName } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  className?: string;
};

/** The design's quick-action row: blue icon tile, title, hint, arrow. */
export function ListRow({ title, subtitle, icon, leading, trailing, onPress, className }: Props) {
  const body = (
    <View className="flex-row items-center gap-3">
      {leading ??
        (icon ? (
          <View className="h-[34px] w-[34px] items-center justify-center rounded-tile bg-tile">
            <Icon name={icon} size={20} color={colors.link} />
          </View>
        ) : null)}
      <View className="flex-1 gap-[5px]">
        <Text variant="strong" numberOfLines={2}>{title}</Text>
        {subtitle ? <Text variant="caption" numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Icon name="arrow" size={20} color={colors.ink} /> : null)}
    </View>
  );
  return onPress ? (
    <PressableCard variant="action" onPress={onPress} className={className}>{body}</PressableCard>
  ) : (
    <Card variant="action" className={className}>{body}</Card>
  );
}
