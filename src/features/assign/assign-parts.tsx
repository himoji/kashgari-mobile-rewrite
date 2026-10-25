import { skipToken, useSuspenseQuery } from '@apollo/client/react';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { ASSIGN_MATERIALS } from '@/features/assign/gql';
import { BLOCK_GROUPS, NOT_SUPPORTED, type Block, type BlockType, type Source } from '@/features/assign/builder';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/dialog';
import { Skeleton } from '@/ui/feedback';
import { Icon, type IconName } from '@/ui/icon';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

export type Stage = 1 | 2 | 3;

/** "1 Бастау — 2 Мазмұны — 3 Тағайындау": done steps can be tapped to go back. */
export function StageNav({ stage, onGo }: { stage: Stage; onGo: (s: Stage) => void }) {
  const { t } = useTranslation();
  const labels = [t('assign.steps.start'), t('assign.steps.content'), t('assign.steps.assign')];
  return (
    <View accessibilityRole="tablist" className="mb-7 mt-[18px] h-[55px] flex-row">
      <View className="absolute left-[16.6%] right-[16.6%] top-[14px] h-0.5 bg-[#edf2f8]" />
      {labels.map((label, i) => {
        const n = (i + 1) as Stage;
        const active = n === stage;
        const tone = active ? '#1877f2' : n < stage ? '#8493a8' : '#a3afbf';
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: n > stage }}
            disabled={n >= stage}
            onPress={() => onGo(n)}
            className="press flex-1 items-center gap-[7px]"
          >
            <View
              className="h-[30px] w-[30px] items-center justify-center rounded-full"
              style={{ backgroundColor: active ? '#1877f2' : '#edf2f8', boxShadow: '0 0 0 5px #ffffff' }}
            >
              <Text className="font-body-semibold text-[13px] leading-[20px]" style={{ color: active ? '#ffffff' : tone }}>{n}</Text>
            </View>
            <Text className="font-body text-[12px] leading-[18px]" style={{ color: tone }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SourceChoice({ icon, title, hint, onPress }: { icon: IconName; title: string; hint: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="mb-3 flex-row items-center gap-[13px] rounded-[18px] bg-[#f3f7fd] px-4 py-5 active:opacity-80">
      <Icon name={icon} size={20} color={icon === 'plus' ? colors.link : colors.ink} />
      <View className="flex-1 gap-1.5">
        <Text className="font-body-bold text-[15px] leading-[21px] text-[#263449]">{title}</Text>
        <Text className="font-body text-[12px] leading-[18px] text-[#8493a8]">{hint}</Text>
      </View>
      <Icon name="arrow" size={20} color={colors.ink} />
    </Pressable>
  );
}

export function ComposerError({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="alert" className="mb-3 rounded-tile bg-[#fff3f1] px-3 py-2.5">
      <Text className="font-body text-[15px] leading-[23.25px] text-[#b54742]">{children}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text className="mb-[7px] font-body-medium text-[11px] leading-[17px] text-[#91a0b6]">{children}</Text>;
}

export function BlockRow({ block, index, label, onMenu }: { block: Block; index: number; label: string; onMenu: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  return (
    <View className="flex-row items-center gap-2.5 rounded-[14px] bg-surface px-2.5 py-3" style={{ boxShadow: '0 3px 14px rgba(36,38,49,0.043)' }}>
      <View className="h-[25px] w-[25px] items-center justify-center rounded-lg bg-[#f1f6fd]">
        <Text className="font-body text-[11px] leading-[16.5px] text-[#8ea7c9]">{index + 1}</Text>
      </View>
      <View className="flex-1 py-0.5">
        <Text className="mb-1 font-body text-[10px] leading-[15px] text-[#9eabc0]">{label}</Text>
        <Text className="font-body-medium text-[13px] leading-[20px] text-[#3c4b63]">{content(block.title)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('assign.blockMenu')}
        onPress={onMenu}
        className="h-[34px] w-11 items-center justify-center rounded-[9px] bg-[#f6f8fc] active:opacity-70"
      >
        <Text className="font-body text-[20px] leading-[30px] text-[#95a5bb]">⋯</Text>
      </Pressable>
    </View>
  );
}

/** Light row buttons of the content step ("Бөлім қосу", "Дайын материалды таңдау", preview). */
export function ComposerButton({ kind, icon, label, onPress }: { kind: 'add' | 'material' | 'preview'; icon: IconName; label: string; onPress: () => void }) {
  const add = kind === 'add';
  const color = add ? '#6c99d5' : kind === 'material' ? '#8498b5' : '#7196c6';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn('mb-3 flex-row items-center gap-2 rounded-control p-3 active:opacity-80', add ? 'min-h-[45px] justify-center bg-[#f0f6ff]' : 'bg-surface', kind === 'preview' ? 'min-h-12' : 'min-h-[45px]')}
      style={add ? undefined : { boxShadow: '0 3px 12px rgba(36,38,49,0.035)' }}
    >
      <Icon name={icon} size={17} color={add ? color : colors.ink} />
      <Text className={cn('font-body', kind === 'preview' ? 'text-[12px] leading-[18px]' : 'text-[13px] leading-[20px]', !add && 'flex-1')} style={{ color }}>
        {label}
      </Text>
      {add ? null : <Icon name="arrow" size={17} color={colors.ink} />}
    </Pressable>
  );
}

export function Footer({ stage, busy, onDraft, onBack, onNext }: { stage: Stage; busy: boolean; onDraft: () => void; onBack: () => void; onNext: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute inset-x-0 bottom-0 flex-row items-center gap-2 bg-white/95 px-5 pt-3"
      style={{ paddingBottom: insets.bottom + 18, boxShadow: '0 -4px 16px rgba(36,38,49,0.016)' }}
    >
      <Pressable accessibilityRole="button" disabled={busy} onPress={onDraft} className="h-[46px] items-center justify-center rounded-control bg-[#f3f7ff] px-2.5 active:opacity-80">
        <Text className="font-body-semibold text-[12px] leading-[18px] text-link">{t('assign.draft')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('assign.previous')}
        disabled={busy}
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-tile bg-[#f5f8fc] active:opacity-80"
      >
        <Icon name="back" size={20} color={colors.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onNext}
        className="h-[46px] flex-1 flex-row items-center justify-center gap-[7px] rounded-control bg-primary-strong active:bg-[#0667e7]"
      >
        {busy ? <ActivityIndicator color="#fff" /> : null}
        <Text className="font-body-semibold text-[12px] leading-[18px] text-white">{stage === 3 ? t('assign.assign') : t('assign.next')}</Text>
        <Icon name="arrow" size={16} color={colors.white} />
      </Pressable>
    </View>
  );
}

/** "Қосу": every block type of the design, grouped; types the API cannot build are marked "Жақында". */
export function AddDialog({ visible, onClose, onMaterial, onType }: { visible: boolean; onClose: () => void; onMaterial: () => void; onType: (t: BlockType) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string>('questions');
  return (
    <Dialog visible={visible} title={t('assign.add')} onClose={onClose}>
      <Pressable accessibilityRole="button" onPress={onMaterial} className="mb-3.5 h-11 flex-row items-center justify-between gap-2 rounded-control bg-tile px-3 active:opacity-80">
        <Icon name="book" size={18} color={colors.ink} />
        <Text className="font-body text-[13px] leading-[19.5px] text-[#7288a7]">{t('assign.ready')}</Text>
        <Icon name="arrow" size={18} color={colors.ink} />
      </Pressable>
      {BLOCK_GROUPS.map((g) => {
        const expanded = open === g.key;
        return (
          <View key={g.key} className="my-2">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? '' : g.key)}
              className="press h-[42px] flex-row items-center justify-between"
            >
              <Text className="font-body text-[11px] leading-[16.5px] text-[#99a8bd]">{t(`assign.groups.${g.key}`)}</Text>
              <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                <Icon name="down" size={18} color={colors.ink} />
              </View>
            </Pressable>
            {expanded
              ? g.types.map((type) => {
                  const soon = NOT_SUPPORTED.includes(type);
                  return (
                    <Pressable
                      key={type}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: soon }}
                      disabled={soon}
                      onPress={() => onType(type)}
                      className="h-11 flex-row items-center justify-between gap-2 rounded-tile px-2 active:bg-canvas"
                    >
                      <Text className={cn('flex-1 font-body text-[13px] leading-[19.5px] text-[#7288a7]', soon && 'opacity-60')}>{t(`assign.blocks.${type}`)}</Text>
                      {soon ? (
                        <View className="rounded-md bg-canvas px-2 py-0.5">
                          <Text className="font-body text-[10px] leading-[15px] text-subtle">{t('assign.soon')}</Text>
                        </View>
                      ) : (
                        <Icon name="plus" size={16} color={colors.subtle} />
                      )}
                    </Pressable>
                  );
                })
              : null}
          </View>
        );
      })}
    </Dialog>
  );
}

/** "Материал" sheet: a grade's texts and the grammar sets. */
export function MaterialPicker({ visible, grades, onClose, onPick }: { visible: boolean; grades: number[]; onClose: () => void; onPick: (s: Source) => void }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);
  const grade = picked ?? grades[0] ?? 7;
  return (
    <Dialog visible={visible} variant="sheet" title={t('assign.material')} onClose={onClose}>
      {grades.length > 1 ? (
        <View className="mb-2 flex-row flex-wrap gap-1.5">
          {grades.map((g) => (
            <Pressable
              key={g}
              accessibilityRole="radio"
              accessibilityState={{ selected: g === grade }}
              onPress={() => setPicked(g)}
              className={cn('press h-9 justify-center rounded-tile px-3', g === grade ? 'bg-primary-strong' : 'bg-track')}
            >
              <Text className={cn('font-body-semibold text-[12px]', g === grade ? 'text-white' : 'text-link')}>{t('materials.gradeLabel', { grade: g })}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <QueryBoundary
        fallback={
          <View className="gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </View>
        }
      >
        <MaterialRows grade={grade} active={visible} onPick={onPick} />
      </QueryBoundary>
    </Dialog>
  );
}

function MaterialRows({ grade, active, onPick }: { grade: number; active: boolean; onPick: (s: Source) => void }) {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const content = useContentText();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(ASSIGN_MATERIALS, active ? { variables: { grade, teacherId: profileId }, queryKey } : skipToken);
  const rows = [
    ...(data?.grade?.sections ?? []).flatMap((s) => [
      ...s.oqylymTexts.map((x) => ({ ref: { kind: 'oqylym' as const, id: x.id }, title: x.title, line: `${grade} · ${t('materials.modules.oqylym')}` })),
      ...s.tyndalymTexts.map((x) => ({ ref: { kind: 'tyndalym' as const, id: x.id }, title: x.title, line: `${grade} · ${t('materials.modules.tyndalym')}` })),
    ]),
    ...(data?.allDurysTitles ?? []).map((x) => ({ ref: { kind: 'grammar' as const, id: x.id }, title: x.title, line: t('materials.modules.grammar') })),
  ];
  return (
    <View className="gap-0.5">
      {rows.map((r) => (
        <Pressable
          key={`${r.ref.kind}:${r.ref.id}`}
          accessibilityRole="button"
          onPress={() => onPick({ ref: r.ref, title: r.title })}
          className="gap-1.5 rounded-control bg-surface px-2.5 py-4 active:bg-canvas"
        >
          <Text className="font-body-medium text-[14px] leading-[21px] text-[#263449]">{content(r.title)}</Text>
          <Text className="mt-1 font-body text-[12px] leading-[18px] text-[#8b99ac]">{r.line}</Text>
        </Pressable>
      ))}
    </View>
  );
}
