import { Pressable, View } from 'react-native';

import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = { title: string; date: string; pending: boolean; score: number | null; onPress?: () => void };

/** A student's work in the progress dialog: title, date, then a score or the pen tile when it awaits review. */
export function StudentWorkRow({ title, date, pending, score, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-[68px] flex-row items-center gap-3 rounded-[13px] bg-[#f6f9fd] px-3 py-[14px] active:opacity-80"
    >
      <View className="flex-1">
        <Text className="font-body-medium text-[13px] leading-[20px]" numberOfLines={2}>{title}</Text>
        <Text className="mt-[5px] font-body text-[10px] leading-[15px] text-[#9aabc2]">{date}</Text>
      </View>
      {pending ? (
        <View className="h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#e8f2ff]">
          <Icon name="pen" size={15} color="#4a8ef0" />
        </View>
      ) : (
        <Text className="font-body-medium text-[13px] leading-[19.5px] text-[#6696d8]">{score == null ? '—' : `${score}%`}</Text>
      )}
    </Pressable>
  );
}
