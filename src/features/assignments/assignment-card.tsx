import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { StatusMark } from '@/ui/status-mark';
import { Text } from '@/ui/text';

import { deadlineLabel, isCompleted, type StudentAssignment } from './map';
import { assignmentHref, resultHref } from './routes';

/** "4 күн қалды", "Бүгін" or "30 қыр." for a past deadline. */
export function useDeadlineText() {
  const { t } = useTranslation();
  return (deadline: number | undefined) => {
    if (deadline == null) return null;
    const label = deadlineLabel(deadline, new Date());
    if (label.kind === 'today') return t('assignments.deadline.today');
    if (label.kind === 'left') return t('assignments.deadline.daysLeft', { count: label.days });
    return `${label.day} ${t(`assignments.months.${label.month}`)}`;
  };
}

/** "Грамматика · 10 мин" */
export function useModuleLine() {
  const { t } = useTranslation();
  return (a: StudentAssignment) =>
    [t(`assignments.modules.${a.kind}`), a.minutes ? `${a.minutes} ${t('assignments.min')}` : null].filter(Boolean).join(' · ');
}

/** The design's school task card: title, module · minutes, status with deadline or score, and the one action (none when `readOnly`, e.g. parents). */
export function AssignmentCard({ item, readOnly }: { item: StudentAssignment; readOnly?: boolean }) {
  const { t } = useTranslation();
  const content = useContentText();
  const deadlineText = useDeadlineText();
  const moduleLine = useModuleLine();
  const completed = isCompleted(item);
  const showScore = item.state === 'done' && item.score != null;
  const aside = showScore ? null : deadlineText(item.deadline);

  return (
    <Card variant="item" className="gap-2.5">
      <View>
        <Text className="mb-[5px] font-body-semibold text-[14px] leading-[19px]" numberOfLines={2}>
          {content(item.title)}
        </Text>
        <Text variant="meta">{moduleLine(item)}</Text>
      </View>
      <View className="min-h-4 flex-row items-center gap-[18px]">
        <StatusMark status={item.status} label={t(`assignments.state.${item.state}`)} />
        {showScore ? (
          <Text className="font-body-semibold text-[16px] leading-[16px] text-link">{item.score}%</Text>
        ) : aside ? (
          <Text className="font-body text-[12px] leading-[16px] text-meta">{aside}</Text>
        ) : null}
      </View>
      {readOnly ? null : completed ? (
        <Button variant="soft" label={t('assignments.viewResults')} onPress={() => router.push(resultHref(item))} />
      ) : (
        <Button label={t('assignments.start')} onPress={() => router.push(assignmentHref(item))} />
      )}
    </Card>
  );
}
