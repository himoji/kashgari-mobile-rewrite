import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { motion, panelIn } from '@/lib/motion';
import { cn } from '@/ui/cn';
import { gradient } from '@/ui/gradient';
import { useSlidingPill } from '@/ui/sliding-pill';
import { Text } from '@/ui/text';

type Option<T> = { value: T; label: string; count?: number };
type Variant = 'tabs' | 'choice' | 'section';
type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  /** tabs: white pill on light blue (lists). choice: solid blue pill (settings toggles). section: the School page's three-way switch. */
  variant?: Variant;
  className?: string;
};

const track: Record<Variant, string> = {
  tabs: 'gap-1 rounded-control bg-track p-1',
  choice: 'gap-1 rounded-control bg-track p-1',
  section: 'mb-[18px] h-[50px] gap-1 rounded-[13px] bg-[#f2f6fc] p-1',
};
const pill: Record<Variant, string> = {
  tabs: 'rounded-[9px] bg-surface shadow-pill',
  choice: 'rounded-[9px] bg-primary-strong',
  section: 'rounded-tile bg-surface shadow-[0_2px_6px_rgba(36,38,49,0.035)]',
};
const item: Record<Variant, string> = {
  tabs: 'h-11 flex-auto flex-row px-2.5',
  choice: 'h-11 flex-1 flex-row px-2.5',
  section: 'flex-1 px-px',
};

function label(variant: Variant, selected: boolean) {
  if (variant === 'choice') return cn('font-body-medium text-[14px] leading-[20px]', selected ? 'text-white' : 'text-muted');
  if (variant === 'section') return cn('font-body-medium text-[13px] leading-[19px]', selected ? 'text-link' : 'text-subtle');
  return cn('text-[12px] leading-[15px]', selected ? 'font-body-semibold text-link' : 'font-body-medium text-body');
}

/** Segmented switch whose pill slides to the chosen option (micro.js movePill). */
export function SegmentedTabs<T extends string>({ value, options, onChange, variant = 'tabs', className }: Props<T>) {
  const { style, measure } = useSlidingPill(value, motion.segment);
  return (
    <View accessibilityRole="tablist" className={cn('flex-row', track[variant], className)}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 4, bottom: 4, left: 0 }, style]}>
        <View className={cn('flex-1', pill[variant])} style={variant === 'choice' ? gradient('sheen') : undefined} />
      </Animated.View>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onLayout={measure(o.value)}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(o.value);
            }}
            className={cn('press items-center justify-center rounded-[9px]', item[variant])}
          >
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} className={label(variant, selected)}>
              {o.label}
            </Text>
            {o.count != null ? (
              <Text maxFontSizeMultiplier={1.3} className={cn('ml-[6px] text-[11px] text-body', selected ? 'font-body-semibold' : 'font-body-medium')}>{o.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** The content under a SegmentedTabs: fades up when the chosen option (`id`) changes (micro.js transitionPanel). */
export function SegmentPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Animated.View key={id} entering={panelIn}>
      {children}
    </Animated.View>
  );
}
