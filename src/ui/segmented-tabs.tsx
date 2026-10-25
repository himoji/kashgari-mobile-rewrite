import { Pressable, View } from 'react-native';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

type Option<T> = { value: T; label: string; count?: number };
type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  /** tabs: white pill on light blue (lists). choice: solid blue pill (settings toggles). */
  variant?: 'tabs' | 'choice';
  className?: string;
};

export function SegmentedTabs<T extends string>({ value, options, onChange, variant = 'tabs', className }: Props<T>) {
  const choice = variant === 'choice';
  return (
    <View accessibilityRole="tablist" className={cn('flex-row gap-1 rounded-control bg-track p-1', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            className={cn(
              'h-11 flex-row items-center justify-center rounded-[9px] px-2.5',
              choice ? 'flex-1' : 'flex-auto',
              selected && (choice ? 'bg-primary-strong sheen' : 'bg-surface shadow-pill'),
            )}
          >
            <Text
              numberOfLines={1}
              className={cn(
                choice ? 'font-body-medium text-[14px] leading-[20px]' : 'text-[12px] leading-[15px]',
                choice ? (selected ? 'text-white' : 'text-muted') : selected ? 'font-body-semibold text-link' : 'font-body-medium text-body',
              )}
            >
              {o.label}
            </Text>
            {o.count != null ? (
              <Text className={cn('ml-[6px] text-[11px] text-body', selected ? 'font-body-semibold' : 'font-body-medium')}>{o.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
