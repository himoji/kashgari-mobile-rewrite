import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ClassAvatar } from '@/features/classes/class-avatar';
import type { StudentSummary } from '@/features/classes/class-data';
import { StudentGradeRow } from '@/features/classes/student-grade-row';
import { Text } from '@/ui/text';

type Props = {
  className: string;
  summaries: StudentSummary[];
  onOpenStudent?: (studentId: string) => void;
  /** Buttons under the roster (teacher: assignments / review answers). */
  footer?: ReactNode;
};

/** "Оқушы бағалары": class tile, student count and the roster with submitted counts and averages. */
export function ClassDetailView({ className, summaries, onOpenStudent, footer }: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <View className="mb-6 flex-row items-center gap-3">
        <ClassAvatar name={className} />
        <View className="flex-1">
          <Text className="mb-[3px] font-body-semibold text-[21px] leading-[28px]">{t('classes.studentGrades')}</Text>
          <Text className="font-body text-[12px] leading-[18px] text-subtle">{t('classes.studentCount', { count: summaries.length })}</Text>
        </View>
      </View>
      <View className="gap-1.5">
        {summaries.map((s) => (
          <StudentGradeRow
            key={s.student.id}
            name={s.student.name}
            submitted={s.submitted}
            eligible={s.eligible}
            average={s.average}
            onPress={onOpenStudent ? () => onOpenStudent(s.student.id) : undefined}
          />
        ))}
      </View>
      {footer ? <View className="mt-5 flex-row gap-2">{footer}</View> : null}
    </View>
  );
}
