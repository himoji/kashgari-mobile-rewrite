import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Attempt, Work } from '@/features/classes/class-data';
import { shortDate } from '@/features/classes/format';
import { StudentWorkRow } from '@/features/classes/student-work-row';
import { useContentText } from '@/lib/i18n';
import { Dialog } from '@/ui/dialog';
import { Text } from '@/ui/text';

type Props = {
  visible: boolean;
  studentName: string;
  rows: { attempt: Attempt; work: Work }[];
  /** Omit to show the rows read-only (e.g. parents). */
  onOpen?: (row: { attempt: Attempt; work: Work }) => void;
  onClose: () => void;
};

/** A student's latest work with scores (opened from a roster row). */
export function StudentProgressDialog({ visible, studentName, rows, onOpen, onClose }: Props) {
  const { t } = useTranslation();
  const content = useContentText();
  return (
    <Dialog visible={visible} title={studentName} onClose={onClose}>
      <View className="gap-2.5">
        {rows.map((row) => (
          <StudentWorkRow
            key={row.attempt.id}
            title={content(row.work.name)}
            date={shortDate(row.attempt.createdAt, t)}
            pending={row.attempt.pending}
            score={row.attempt.score}
            onPress={onOpen && row.attempt.reviewKind ? () => onOpen(row) : undefined}
          />
        ))}
        {rows.length === 0 ? <Text className="py-6 text-center font-body-semibold text-[15px]">{t('classes.noResponses')}</Text> : null}
      </View>
    </Dialog>
  );
}
