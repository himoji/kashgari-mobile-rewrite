import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ClassAvatar } from '@/features/classes/class-avatar';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = { name: string; studentCount: number; workCount: number; onPress: () => void };

/** A class in the class list: its tile, the class name, "8 оқушы · 10 тапсырма", arrow. */
export function ClassCard({ name, studentCount, workCount, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-[13px] rounded-[16px] bg-surface px-[14px] py-4 active:opacity-80"
      style={{ boxShadow: '0 3px 14px rgba(36,38,49,0.05)' }}
    >
      <ClassAvatar name={name} />
      <View className="flex-1">
        <Text className="font-body-medium text-[14px] leading-[20px]" numberOfLines={2}>{name}</Text>
        <Text className="mt-1 font-body text-[11px] leading-[16px] text-subtle" numberOfLines={1}>
          {t('classes.studentCount', { count: studentCount })} · {t('classes.workCount', { count: workCount })}
        </Text>
      </View>
      <Icon name="arrow" size={18} color={colors.ink} />
    </Pressable>
  );
}
