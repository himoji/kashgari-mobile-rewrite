import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AssignmentKind } from '@/features/assignments/routes';
import type { Child, ModuleSummary } from '@/features/children/children-data';
import { ProgressLine } from '@/features/classes/progress-line';
import { colors } from '@/theme/colors';
import { Avatar } from '@/ui/avatar';
import { Card } from '@/ui/card';
import { Icon, type IconName } from '@/ui/icon';
import { ProgressRing } from '@/ui/progress-ring';
import { Text } from '@/ui/text';

/** Small pale label ("7А", "A2 деңгей"), the class chip of the work cards. */
export function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-[7px] bg-[#f0f5fc] px-[7px] py-0.5">
      <Text className="font-body-medium text-[11px] leading-[17px] text-[#7994ba]">{label}</Text>
    </View>
  );
}

/** "Class · school" line under a child's name. */
export const childLine = (child: Child) => [child.className, child.schoolName].filter(Boolean).join(' · ');

/** A child in the parent's list: initials, name, class and school, level and streak chips, arrow. */
export function ChildCard({ child, onPress }: { child: Child; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-[13px] rounded-[16px] bg-surface px-[14px] py-4 active:opacity-80"
      style={{ boxShadow: '0 3px 14px rgba(36,38,49,0.05)' }}
    >
      <Avatar name={child.name} size={48} />
      <View className="flex-1">
        <Text className="font-body-semibold text-[15px] leading-[22px]" numberOfLines={1}>{child.name}</Text>
        <Text className="mt-0.5 font-body text-[11px] leading-[16px] text-subtle" numberOfLines={1}>{childLine(child)}</Text>
        <View className="mt-2 flex-row gap-1.5">
          <Chip label={t('parent.level', { level: child.level })} />
          <Chip label={t('parent.streakDays', { count: child.streak })} />
        </View>
      </View>
      <Icon name="arrow" size={18} color={colors.ink} />
    </Pressable>
  );
}

/** The student home's blue progress card, read-only: done / total, average score and the completion ring. */
export function ChildProgressCard({ done, total, average }: { done: number; total: number; average?: number }) {
  const { t } = useTranslation();
  return (
    <Card variant="blue" className="flex-row items-center gap-2">
      <View className="flex-1">
        <Text className="font-body-medium text-[38px] leading-[43px] text-white">
          {done}
          <Text className="font-body text-[22px] leading-[43px] text-white"> / {total}</Text>
        </Text>
        <Text className="mb-3 mt-1.5 font-body text-[12px] leading-[18px] text-white/95">{t('parent.completed')}</Text>
        <View
          className="self-start rounded-[11px] bg-white px-[14px] py-2"
          style={{ boxShadow: 'inset 0 1px 3px rgba(109,160,230,0.44), 0 2px 5px rgba(22,88,180,0.07)' }}
        >
          <Text className="font-body-semibold text-[12px] leading-[18px] text-link">
            {t('parent.average')} · {average == null ? '—' : `${average}%`}
          </Text>
        </View>
      </View>
      <View className="h-[108px] w-[108px] items-center justify-center">
        <ProgressRing value={total ? done / total : 0} size={98} stroke={10} track="rgba(255,255,255,0.25)" label={t('parent.completion')} />
      </View>
    </Card>
  );
}

const MODULE_ICON: Record<AssignmentKind, IconName> = {
  oqylym: 'book',
  tyndalym: 'audio',
  durys: 'tasks',
  oyna: 'game',
  zhazylym: 'pen',
  lesson: 'lesson',
};

/** One module on the child page: icon tile, name, done / total with the average, completion line. */
export function ModuleRow({ summary, onPress }: { summary: ModuleSummary; onPress: () => void }) {
  const { t } = useTranslation();
  const pct = summary.total ? (summary.done / summary.total) * 100 : 0;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3 py-3 active:opacity-70">
      <View className="h-[34px] w-[34px] items-center justify-center rounded-tile bg-tile">
        <Icon name={MODULE_ICON[summary.kind]} size={19} color={colors.link} />
      </View>
      <View className="flex-1">
        <View className="mb-2 flex-row items-center justify-between gap-2">
          <Text className="font-body-medium text-[14px] leading-[20px]">{t(`assignments.modules.${summary.kind}`)}</Text>
          <Text className="font-body-medium text-[12px] leading-[17px] text-[#7598c8]">
            {summary.done}/{summary.total}
            {summary.average != null ? ` · ${summary.average}%` : ''}
          </Text>
        </View>
        <ProgressLine pct={pct} />
      </View>
      <Icon name="arrow" size={18} color={colors.ink} />
    </Pressable>
  );
}
