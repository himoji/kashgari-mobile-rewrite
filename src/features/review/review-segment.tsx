import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session';
import { reviewItems, type ClassWork } from '@/features/classes/class-data';
import { shortDate } from '@/features/classes/format';
import { ReviewRow } from '@/features/review/review-row';
import { submissionHref } from '@/features/review/routes';
import { ClassFilterDialog } from '@/features/teacher-assignments/class-filter-dialog';
import { ALL_CLASSES, useSchoolFilters } from '@/features/teacher-assignments/filters';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { SearchField } from '@/ui/search-field';
import { Text } from '@/ui/text';

type State = 'pending' | 'reviewed';

/** "Тексеру" segment: submissions awaiting a score and those already scored, filterable by class. */
export function ReviewSegment({ classes }: { classes: ClassWork[] }) {
  const { t } = useTranslation();
  const language = useSession((s) => s.uiLanguage);
  const [state, setState] = useState<State>('pending');
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const classFilter = useSchoolFilters((s) => s.classFilter.review);
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);

  const all = useMemo(
    () => reviewItems(classes.filter((c) => classFilter === ALL_CLASSES || c.id === classFilter)),
    [classes, classFilter],
  );
  const pending = all.filter((i) => i.attempt.pending);
  const reviewed = all.filter((i) => !i.attempt.pending);
  const q = query.trim().toLowerCase();
  const list = (state === 'pending' ? pending : reviewed).filter((i) => `${i.studentName} ${i.work.name}`.toLowerCase().includes(q));
  const selectedName = classes.find((c) => c.id === classFilter)?.name ?? t('teacherAssignments.allClasses');

  return (
    <View>
      <View className="mb-[14px] flex-row">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('teacherAssignments.filterByClass')}
          onPress={() => setFilterOpen(true)}
          className="h-9 flex-row items-center gap-[7px] rounded-tile bg-[#f3f7fc] px-2.5 active:opacity-80"
        >
          <Icon name="classes" size={15} color="#697c98" />
          <Text className="font-body text-[12px] leading-[18px] text-[#697c98]">{selectedName}</Text>
          <Icon name="down" size={15} color="#697c98" />
        </Pressable>
      </View>

      <View className="mb-3 flex-row gap-[14px] px-0.5">
        {(
          [
            ['pending', t('review.needsReview'), pending.length],
            ['reviewed', t('review.reviewed'), reviewed.length],
          ] as const
        ).map(([key, label, count]) => {
          const selected = state === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setState(key)}
              className="h-[38px] flex-row items-center gap-1.5"
              style={selected ? { boxShadow: `0 2px 0 ${colors.primary}` } : undefined}
            >
              <Text className={cn('font-body text-[12px] leading-[18px]', selected ? 'text-link' : 'text-subtle')}>{label}</Text>
              <View className="h-5 min-w-5 items-center justify-center rounded-[6px] bg-[#f2f5fa] px-[5px]">
                <Text className={cn('font-body text-[10px] leading-[15px]', selected ? 'text-link' : 'text-subtle')}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SearchField value={query} onChangeText={setQuery} placeholder={t('review.searchPlaceholder')} className="mb-3" />

      <View className="gap-1 p-2">
        {list.map((i) => (
          <ReviewRow
            key={i.attempt.id}
            studentName={i.studentName}
            workName={i.work.name}
            meta={`${i.work.className} · ${shortDate(i.attempt.createdAt, language)}`}
            pending={i.attempt.pending}
            score={i.attempt.score}
            onPress={() => router.push(submissionHref(i.attempt, i.work.key))}
          />
        ))}
        {list.length === 0 ? (
          <View className="items-center gap-2 py-10">
            <Icon name={q ? 'search' : 'check'} size={24} color={colors.subtle} />
            <Text variant="heading" className="text-center">
              {t(q ? 'review.noMatches' : state === 'pending' ? 'review.allCaught' : 'review.noGrades')}
            </Text>
          </View>
        ) : null}
      </View>

      <ClassFilterDialog
        visible={filterOpen}
        classes={classes}
        value={classFilter}
        onChange={(id) => setClassFilter('review', id)}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}
