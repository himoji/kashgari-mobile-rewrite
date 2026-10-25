import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProgressLine } from '@/features/classes/progress-line';
import type { WorkReport } from '@/features/reports/report-data';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

/** Report building blocks shared by the teacher's Reports page and the principal's overview. */

export function ReportSelect<T extends string>({
  value,
  options,
  open,
  onOpenChange,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View className={cn(open && 'z-20')}>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => onOpenChange(!open)}
        className="press-row h-12 flex-row items-center justify-between gap-4 rounded-control bg-surface px-3"
        style={{ boxShadow: 'inset 0 0 0 1px #8a8d99' }}
      >
        <Text className="flex-1 font-body text-[16px] leading-[20.8px]" numberOfLines={1}>{options.find((o) => o.value === value)?.label}</Text>
        <Icon name="down" size={20} color={colors.ink} />
      </Pressable>
      {open ? (
        <View
          accessibilityRole="menu"
          className="absolute inset-x-0 top-[55px] z-30 rounded-control bg-surface p-1.5"
          style={{ boxShadow: '0 8px 30px rgba(36,38,49,0.12)' }}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => (onChange(o.value), onOpenChange(false))}
                className={cn('h-12 flex-row items-center justify-between gap-6 rounded-[9px] px-3', selected ? 'bg-highlight active:bg-highlight' : 'active:bg-canvas')}
              >
                <Text className="font-body text-[16px] leading-[24px]">{o.label}</Text>
                {selected ? <Icon name="check" size={18} color={colors.ink} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      className="flex-1 gap-1.5 rounded-card bg-[#f4f8ff] p-[14px]"
      style={{ boxShadow: '0 1px 2px rgba(36,38,49,0.04), 0 4px 14px rgba(36,38,49,0.04)' }}
    >
      <Text className="font-body text-[12px] leading-[15.6px] text-body" numberOfLines={1}>{label}</Text>
      <Text className="my-2 font-body-semibold text-[26px] leading-[28.6px]">{value}</Text>
    </View>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-card bg-surface p-[14px] shadow-panel">
      <Text className="mb-1.5 font-body-semibold text-[17px] leading-[23px]">{title}</Text>
      {children}
    </View>
  );
}

/** Bars like the prototype's chart: value on top, label below; the first bar can be orange. */
export function Bars({ points, highlightFirst, scale }: { points: { label: string; value: number; text: string }[]; highlightFirst?: boolean; scale: number }) {
  // Up to five columns share the width as in the design; a school with more classes scrolls sideways.
  const scroll = points.length > 5;
  const columns = points.map((p, i) => (
    <View key={`${p.label}-${i}`} className={cn('items-center justify-end gap-1.5', scroll ? 'w-[56px]' : 'flex-1')}>
      <Text className="font-body-medium text-[13px] leading-[19.5px]">{p.text}</Text>
      <View
        className={cn('w-11 rounded-b-[4px] rounded-t-[10px]', highlightFirst && i === 0 ? 'bg-attention' : 'bg-[#68c6a3]')}
        style={{ height: Math.max(4, p.value * scale) }}
      />
      <Text className="font-body text-[12px] leading-[17.4px] text-body" numberOfLines={1}>{p.label}</Text>
    </View>
  ));
  if (!scroll) return <View className="mt-3 h-[190px] flex-row items-end justify-around gap-1.5 px-3 pt-3">{columns}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerClassName="h-[190px] items-end gap-1.5 px-3 pt-3">
      {columns}
    </ScrollView>
  );
}

/** "Модульдерді пайдалану": submissions per module with their share. */
export function ModuleUsage({ modules }: { modules: WorkReport['modules'] }) {
  const { t } = useTranslation();
  return (
    <Panel title={t('reports.moduleUsage')}>
      <View className="mt-6 gap-3">
        {modules.map((m) => (
          <View key={m.key}>
            <View className="flex-row items-center justify-between gap-2.5">
              <Text className="font-body text-[16px] leading-[24px]">{t(`reports.modules.${m.key}`)}</Text>
              <Text className="font-body-bold text-[16px] leading-[24px]">
                {m.count} · {m.pct}%
              </Text>
            </View>
            <ProgressLine pct={m.pct} tone="strong" height={7} className="mt-2" />
          </View>
        ))}
      </View>
    </Panel>
  );
}
