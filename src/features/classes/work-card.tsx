import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkStatus } from '@/features/classes/class-data';
import { ProgressLine } from '@/features/classes/progress-line';
import { useContentText } from '@/lib/i18n';
import { Text } from '@/ui/text';

type Props = {
  name: string;
  className: string;
  date: string;
  status: WorkStatus;
  done: number;
  total: number;
  pct: number;
  onPress: () => void;
};

/** An assignment in a list: title (+ "Жоба"), class chip, date, "6/8" and the completion line. */
export function WorkCard({ name, className, date, status, done, total, pct, onPress }: Props) {
  const { t } = useTranslation();
  const content = useContentText();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-[16px] bg-surface px-[14px] py-4 active:opacity-80"
      style={{ boxShadow: '0 3px 14px rgba(36,38,49,0.047)' }}
    >
      <View className="mb-[13px] flex-row items-center gap-2">
        <Text className="flex-1 font-body-semibold text-[15px] leading-[22px]" numberOfLines={2}>{content(name)}</Text>
        {status === 'draft' ? <Text className="font-body text-[16px] leading-[24px]">{t('classes.status.draft')}</Text> : null}
      </View>
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <View className="rounded-[7px] bg-[#f0f5fc] px-[7px] py-0.5">
          <Text className="font-body-medium text-[11px] leading-[17px] text-[#7994ba]">{className}</Text>
        </View>
        <Text className="font-body text-[11px] leading-[17px] text-[#94a1b5]">{date}</Text>
        {status === 'scheduled' ? <Text className="font-body text-[11px] leading-[17px] text-[#94a1b5]">{t('classes.status.scheduled')}</Text> : null}
        <Text className="ml-auto font-body-medium text-[11px] leading-[17px] text-[#7598c8]">{done}/{total}</Text>
      </View>
      <ProgressLine pct={pct} />
    </Pressable>
  );
}
