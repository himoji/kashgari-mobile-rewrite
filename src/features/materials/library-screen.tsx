import { useSuspenseQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { MATERIALS_GRADE, MATERIALS_GRAMMAR } from '@/features/materials/gql';
import { filterLibrary, libraryItems, sectionName, type LibraryFilter, type LibraryItem } from '@/features/materials/library-items';
import { coverTint, materialArt } from '@/features/materials/material-art';
import { LEVEL_OPTIONS, materialParam, type Level, type MaterialKind } from '@/features/materials/material-ref';
import { Select } from '@/features/materials/select';
import { useGrades } from '@/features/materials/use-grades';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Dialog } from '@/ui/dialog';
import { EmptyState, NotReady, Skeleton } from '@/ui/feedback';
import { Icon } from '@/ui/icon';
import { IconButton } from '@/ui/icon-button';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

function Badge({ label }: { label: string }) {
  return (
    <View className="self-start rounded-[7px] bg-[#fafbfe] px-[9px] py-[5px]">
      <Text className="font-body text-[13px] leading-[18.2px] text-meta">{label}</Text>
    </View>
  );
}

function MaterialCard({ item, onSave }: { item: LibraryItem; onSave: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  const kind = item.ref.kind;
  return (
    <Card variant="panel">
      <View className="flex-row gap-[14px]">
        <View className="h-[110px] w-24 overflow-hidden rounded-[14px] px-2 pt-1.5" style={{ backgroundColor: coverTint[kind] }}>
          {item.level ? <Text className="font-body-medium text-[13px] leading-[19.5px]">{item.level}</Text> : null}
          <Image
            source={item.thumbnail ? { uri: item.thumbnail } : materialArt[kind]}
            style={{ position: 'absolute', left: 14, top: 28, width: 90, height: 90 }}
            contentFit={item.thumbnail ? 'cover' : 'contain'}
          />
        </View>
        <View className="flex-1 pt-4">
          <View className="flex-row items-start justify-between gap-1.5">
            <View className="flex-1 gap-1">
              <Badge label={t(`materials.modules.${kind}`)} />
              {item.grade != null ? <Badge label={t('materials.gradeValue', { grade: item.grade })} /> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('materials.save')}
              onPress={onSave}
              className="-mr-1 -mt-2 h-11 w-11 items-center justify-center rounded-full bg-[#fafbfe] active:opacity-70"
            >
              <Heart size={21} color={colors.subtle} strokeWidth={1.6} />
            </Pressable>
          </View>
          <Text className="mt-1.5 font-body-semibold text-[16px] leading-[21.6px]">{content(item.title)}</Text>
          {item.topic || kind === 'grammar' ? (
            <Text className="font-body text-[13px] leading-[20.15px] text-body">{content(item.topic ?? t('materials.modules.grammar'))}</Text>
          ) : null}
        </View>
      </View>
      <View className="mt-3 flex-row gap-2 pt-[22px]">
        <Button
          variant="soft"
          className="flex-1"
          label={t('materials.preview')}
          onPress={() => router.push({ pathname: '/teacher/material/[id]', params: { id: item.ref.id, kind } })}
        />
        <Button
          variant="strong"
          className="flex-1"
          label={t('materials.assignShort')}
          onPress={() => router.push({ pathname: '/teacher/assign/new', params: { material: materialParam(item.ref) } })}
        />
      </View>
    </Card>
  );
}

type Open = 'module' | 'level' | 'grade' | null;
const INITIAL: LibraryFilter = { module: 'all', level: 'all', search: '' };

/** The library: every text and grammar set, filtered by module, CEFR level and grade. */
export function LibraryScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<LibraryFilter>(INITIAL);
  const [pickedGrade, setPickedGrade] = useState<number | null>(null);
  const [open, setOpen] = useState<Open>(null);
  const [notReady, setNotReady] = useState(false);
  const controls: Controls = { filter, setFilter, open, setOpen, setPickedGrade, onSaved: () => setNotReady(true) };

  return (
    <TabScreen
      title={t('materials.title')}
      mascot="learning"
      actions={<IconButton tone="glass" icon="back" label={t('common.actions.back')} onPress={() => router.back()} />}
    >
      <View className="flex-row gap-2">
        <Button variant="soft" className="flex-1" label={t('materials.wordBank')} onPress={() => router.push('/teacher/word-bank')} />
        <Button variant="strong" className="flex-1" icon="plus" label={t('materials.createAssignment')} onPress={() => router.push('/teacher/assign/new')} />
      </View>

      <QueryBoundary
        fallback={
          <LibraryFilters {...controls} grades={[]} grade={null}>
            <ListSkeleton />
          </LibraryFilters>
        }
      >
        <Library {...controls} pickedGrade={pickedGrade} />
      </QueryBoundary>

      <Dialog visible={notReady} title={t('materials.saved')} onClose={() => setNotReady(false)}>
        <NotReady body={t('materials.savedBody')} />
      </Dialog>
    </TabScreen>
  );
}

type Controls = {
  filter: LibraryFilter;
  setFilter: Dispatch<SetStateAction<LibraryFilter>>;
  open: Open;
  setOpen: (open: Open) => void;
  setPickedGrade: (grade: number) => void;
  onSaved: () => void;
};

/** Search and the module / level / grade selects, the saved button, then the list (children). */
function LibraryFilters({
  filter,
  setFilter,
  open,
  setOpen,
  setPickedGrade,
  onSaved,
  grades,
  grade,
  children,
}: Controls & { grades: number[]; grade: number | null; children: ReactNode }) {
  const { t } = useTranslation();
  const toggle = (which: Exclude<Open, null>) => (o: boolean) => setOpen(o ? which : null);
  return (
    <>
      <Card variant="panel" className="z-10 mt-0.5 gap-2.5">
        <View className="h-12 flex-row items-center gap-2.5 rounded-[14px] bg-[#f7f9fd] px-3">
          <Icon name="search" size={20} color={colors.ink} />
          <TextInput
            value={filter.search}
            onChangeText={(search) => setFilter((f) => ({ ...f, search }))}
            placeholder={t('materials.search')}
            placeholderTextColor={colors.subtle}
            accessibilityLabel={t('materials.search')}
            className="h-12 flex-1 font-body text-[16px] text-ink"
          />
        </View>
        <View className={`flex-row gap-2.5 ${open === 'module' || open === 'level' ? 'z-20' : ''}`}>
          <Select<MaterialKind | 'all'>
            className="flex-1"
            label={t('materials.module')}
            value={filter.module}
            open={open === 'module'}
            onOpenChange={toggle('module')}
            onChange={(module) => setFilter((f) => ({ ...f, module }))}
            options={[
              { value: 'all', label: t('materials.allModules') },
              ...(['oqylym', 'tyndalym', 'grammar'] as const).map((m) => ({ value: m, label: t(`materials.modules.${m}`) })),
            ]}
          />
          <Select<Level | 'all'>
            className="flex-1"
            label={t('materials.level')}
            value={filter.level}
            open={open === 'level'}
            onOpenChange={toggle('level')}
            onChange={(level) => setFilter((f) => ({ ...f, level }))}
            options={[{ value: 'all', label: t('materials.allLevels') }, ...LEVEL_OPTIONS.map((l) => ({ value: l, label: l }))]}
          />
        </View>
        <View className="flex-row gap-2.5">
          <Select<string>
            className="flex-1"
            label={t('materials.grade')}
            value={grade != null ? String(grade) : ''}
            open={open === 'grade'}
            onOpenChange={toggle('grade')}
            onChange={(g) => setPickedGrade(Number(g))}
            options={grades.map((g) => ({ value: String(g), label: t('materials.gradeLabel', { grade: g }) }))}
          />
          <View className="flex-1" />
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={onSaved}
        className="mt-0.5 h-11 flex-row items-center gap-2 self-start rounded-control bg-[#f3f7ff] px-[14px] active:opacity-80"
      >
        <Text className="font-body-semibold text-[14px] leading-[18px] text-link">{t('materials.saved')}</Text>
        <View className="rounded-md bg-surface px-1.5 py-0.5">
          <Text className="font-body-semibold text-[14px] leading-[18px] text-link">0</Text>
        </View>
      </Pressable>

      {children}
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <Skeleton className="h-[280px]" />
      <Skeleton className="h-[280px]" />
    </>
  );
}

function Library({ pickedGrade, ...controls }: Controls & { pickedGrade: number | null }) {
  const { grades, defaultGrade } = useGrades();
  const grade = pickedGrade ?? defaultGrade;
  return (
    <LibraryFilters {...controls} grades={grades} grade={grade}>
      {grade == null ? (
        <ListSkeleton />
      ) : (
        <QueryBoundary fallback={<ListSkeleton />}>
          <LibraryList grade={grade} filter={controls.filter} onClear={() => controls.setFilter(INITIAL)} onSaved={controls.onSaved} />
        </QueryBoundary>
      )}
    </LibraryFilters>
  );
}

function LibraryList({ grade, filter, onClear, onSaved }: { grade: number; filter: LibraryFilter; onClear: () => void; onSaved: () => void }) {
  const { t, i18n } = useTranslation();
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const texts = useSuspenseQuery(MATERIALS_GRADE, { variables: { grade, teacherId: profileId }, queryKey });
  const grammar = useSuspenseQuery(MATERIALS_GRAMMAR, { queryKey });
  const items = useMemo(
    () =>
      libraryItems(texts.data.grade, grammar.data.allDurysTitles, (s) => sectionName(s.name, s.section, i18n.language, t('materials.section'))),
    [texts.data, grammar.data, i18n.language, t],
  );
  const list = filterLibrary(items, filter);

  return list.length ? (
    <>
      {list.map((item) => <MaterialCard key={materialParam(item.ref)} item={item} onSave={onSaved} />)}
    </>
  ) : (
    <View>
      <EmptyState title={t('materials.emptyTitle')} body={t('materials.emptyHint')} />
      <Button variant="secondary" className="self-center" label={t('materials.clearFilters')} onPress={onClear} />
    </View>
  );
}
