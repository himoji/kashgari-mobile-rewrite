import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ALL_CLASSES } from '@/features/teacher-assignments/filters';
import { ChoiceRow, Dialog } from '@/ui/dialog';

type Props = {
  visible: boolean;
  classes: { id: string; name: string }[];
  value: string;
  onChange: (classId: string) => void;
  onClose: () => void;
};

/** "Сынып бойынша сүзгі": all classes or one. */
export function ClassFilterDialog({ visible, classes, value, onChange, onClose }: Props) {
  const { t } = useTranslation();
  const choose = (id: string) => {
    onChange(id);
    onClose();
  };
  return (
    <Dialog visible={visible} title={t('teacherAssignments.filterByClass')} onClose={onClose}>
      <View className="gap-[7px]">
        <ChoiceRow
          label={t('teacherAssignments.allClasses')}
          selected={value === ALL_CLASSES}
          onPress={() => choose(ALL_CLASSES)}
        />
        {classes.map((c) => (
          <ChoiceRow
            key={c.id}
            label={c.name}
            selected={value === c.id}
            onPress={() => choose(c.id)}
          />
        ))}
      </View>
    </Dialog>
  );
}
