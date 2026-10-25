import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StudentAvatar } from '@/features/classes/class-avatar';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = { name: string; submitted: number; eligible: number; average: number | null; onPress?: () => void };

/** One roster row: initials, name, "3/10 тапсырды", average %, arrow. */
export function StudentGradeRow({ name, submitted, eligible, average, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      className="min-h-[66px] flex-row items-center gap-2.5 bg-surface px-1 py-3 active:opacity-70"
    >
      <StudentAvatar name={name} />
      <View className="w-32">
        <Text className="font-body-medium text-[12px] leading-[18px]" numberOfLines={1}>{name}</Text>
        <Text className="mt-[3px] font-body text-[10px] leading-[14.5px] text-subtle" numberOfLines={1}>
          {t('classes.submittedOf', { done: submitted, total: eligible })}
        </Text>
      </View>
      <Text className="w-9 font-body-medium text-[12px] leading-[18px] text-[#7095c4]">{average == null ? '—' : `${average}%`}</Text>
      <View className="flex-1 items-center">{onPress ? <Icon name="arrow" size={20} color={colors.ink} /> : null}</View>
    </Pressable>
  );
}
