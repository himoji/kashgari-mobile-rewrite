import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ClassCard } from '@/features/classes/class-card';
import type { ClassWork } from '@/features/classes/class-data';
import { EmptyState } from '@/ui/feedback';
import { SearchField } from '@/ui/search-field';
import { Text } from '@/ui/text';

/** "Сыныптар": search, intro and one card per class. Navigation is the caller's (teacher or principal routes). */
export function ClassesSegment({ classes, onOpenClass }: { classes: ClassWork[]; onOpenClass: (classId: string) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const list = classes.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <View>
      <SearchField value={query} onChangeText={setQuery} placeholder={t('classes.searchClasses')} className="mb-3" />
      <View className="mx-0.5 mb-[14px] mt-[18px]">
        <Text className="mb-[5px] font-body-semibold text-[17px] leading-[24px]">{t('classes.classGrades')}</Text>
        <Text className="font-body text-[12px] leading-[19px] text-subtle">{t('classes.classGradesHint')}</Text>
      </View>
      <View className="gap-3">
        {list.map((c) => (
          <ClassCard
            key={c.id}
            name={c.name}
            studentCount={c.students.length}
            workCount={c.works.filter((w) => w.status !== 'draft').length}
            onPress={() => onOpenClass(c.id)}
          />
        ))}
        {list.length === 0 ? <EmptyState title={t('classes.noClasses')} illustration="classroom" /> : null}
      </View>
    </View>
  );
}
