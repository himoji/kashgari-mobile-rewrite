import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Work } from '@/features/classes/class-data';
import { TEACHER_EDIT_ASSIGNMENT } from '@/features/teacher-assignments/gql';
import { Button } from '@/ui/button';
import { ChoiceRow, Dialog } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Text } from '@/ui/text';

const DAYS = [1, 3, 7, 14];

/** End of the day `days` from now, in unix seconds (the builder uses the same deadline rule). */
const deadlineIn = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

/** Reading and listening assignments can be renamed and given a new deadline (updateAssignment). */
export function EditWorkDialog({ work, visible, onClose }: { work: Work; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(work.name);
  const [days, setDays] = useState<number | null>(null);
  const [save, { loading, error }] = useMutation(TEACHER_EDIT_ASSIGNMENT);

  const submit = async () => {
    // A failure keeps the dialog open with the error line below.
    const result = await save({ variables: { id: work.id, name: name.trim() || work.name, deadline: days ? deadlineIn(days) : work.date } }).catch(() => null);
    if (result?.data) onClose();
  };

  return (
    <Dialog visible={visible} title={t('teacherAssignments.edit')} onClose={onClose}>
      <View className="gap-4">
        <Input label={t('teacherAssignments.editName')} value={name} onChangeText={setName} />
        <View className="gap-2">
          <Text className="font-body-medium text-[12px] leading-[17px] text-body">{t('teacherAssignments.editDeadline')}</Text>
          {DAYS.map((d) => (
            <ChoiceRow key={d} label={t('teacherAssignments.daysFromToday', { count: d })} selected={days === d} onPress={() => setDays(d)} />
          ))}
        </View>
        {error ? <Text tone="danger" variant="meta">{t('common.states.error')}</Text> : null}
        <Button label={t('common.actions.save')} loading={loading} onPress={submit} />
      </View>
    </Dialog>
  );
}
