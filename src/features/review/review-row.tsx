import { Pressable, View } from 'react-native';

import { StudentAvatar } from '@/features/classes/class-avatar';
import { useContentText } from '@/lib/i18n';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = { studentName: string; workName: string; meta: string; pending: boolean; score: number | null; onPress: () => void };

/** A submission in the review list: student, work, "7А · 29 қыр.", then the pen tile or the score. */
export function ReviewRow({ studentName, workName, meta, pending, score, onPress }: Props) {
  const content = useContentText();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-2.5 rounded-[14px] bg-surface px-3 py-[14px] active:opacity-80"
      style={{ boxShadow: '0 3px 13px rgba(36,38,49,0.047)' }}
    >
      <StudentAvatar name={studentName} />
      <View className="flex-1">
        <Text className="font-body-semibold text-[13px] leading-[19px]" numberOfLines={1}>{studentName}</Text>
        <Text className="mt-1 font-body text-[11px] leading-[17px] text-subtle" numberOfLines={1}>{content(workName)}</Text>
        <Text className="mt-1.5 font-body text-[10px] leading-[15px] text-[#a0abbc]" numberOfLines={1}>{meta}</Text>
      </View>
      {pending ? (
        <View className="h-[34px] w-[34px] items-center justify-center rounded-tile bg-[#eff6ff]">
          <Icon name="pen" size={16} color="#3b86ff" />
        </View>
      ) : (
        <Text className="w-[34px] text-center font-body-bold text-[12px] leading-[18px] text-link">{score == null ? '—' : `${score}%`}</Text>
      )}
    </Pressable>
  );
}
