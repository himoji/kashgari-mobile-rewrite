import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session';
import { workNumbers, type ClassWork, type Work } from '@/features/classes/class-data';
import { shortDate } from '@/features/classes/format';
import { WorkCard } from '@/features/classes/work-card';
import { ClassFilterDialog } from '@/features/teacher-assignments/class-filter-dialog';
import { ALL_CLASSES, useSchoolFilters } from '@/features/teacher-assignments/filters';
import { colors } from '@/theme/colors';
import { EmptyState } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { SearchField } from '@/ui/search-field';

export const workHref = (w: Pick<Work, 'kind' | 'id'>): Href =>
  ({ pathname: '/teacher/assignment/[kind]/[id]', params: { kind: w.kind, id: w.id } });

/** "Тапсырмалар" segment: search, class filter and every work with its completion. */
export function AssignmentsSegment({ classes }: { classes: ClassWork[] }) {
  const { t } = useTranslation();
  const language = useSession((s) => s.uiLanguage);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const classFilter = useSchoolFilters((s) => s.classFilter.assignments);
  const setClassFilter = useSchoolFilters((s) => s.setClassFilter);

  const q = query.trim().toLowerCase();
  const works = classes
    .filter((c) => classFilter === ALL_CLASSES || c.id === classFilter)
    .flatMap((c) => c.works)
    .filter((w) => w.name.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View className="pb-[70px]">
      <View className="mb-[14px] flex-row items-center gap-2">
        <SearchField value={query} onChangeText={setQuery} placeholder={t('teacherAssignments.searchAssignments')} className="flex-1" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('teacherAssignments.filterByClass')}
          onPress={() => setFilterOpen(true)}
          className="h-11 w-11 items-center justify-center rounded-control bg-[#f3f7fc] active:opacity-80"
        >
          <Icon name="settings" size={20} color={classFilter === ALL_CLASSES ? colors.ink : colors.link} />
        </Pressable>
      </View>
      <View className="gap-3">
        {works.map((w) => {
          const n = workNumbers(w);
          return (
            <WorkCard
              key={w.key}
              name={w.name}
              className={w.className}
              date={shortDate(w.date, language)}
              status={w.status}
              done={n.done}
              total={n.total}
              pct={n.pct}
              onPress={() => router.push(workHref(w))}
            />
          );
        })}
        {works.length === 0 ? (
          <EmptyState title={t(q ? 'teacherAssignments.noMatches' : 'teacherAssignments.empty')} illustration="materials" />
        ) : null}
      </View>
      <ClassFilterDialog
        visible={filterOpen}
        classes={classes}
        value={classFilter}
        onChange={(id) => setClassFilter('assignments', id)}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}
