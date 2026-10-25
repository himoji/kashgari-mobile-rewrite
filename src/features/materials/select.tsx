import { Pressable, View } from 'react-native';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
  className?: string;
};

/** The library's labelled dropdown: outlined trigger and a floating menu with the yellow selected row. */
export function Select<T extends string>({ label, value, options, open, onOpenChange, onChange, className }: Props<T>) {
  const current = options.find((o) => o.value === value)?.label ?? '';
  return (
    <View className={cn('gap-2', open && 'z-20', className)}>
      <Text className="font-body-medium text-[12px] leading-[17px] text-body">{label}</Text>
      <View>
        <Pressable
          accessibilityRole="combobox"
          accessibilityLabel={label}
          accessibilityState={{ expanded: open }}
          onPress={() => onOpenChange(!open)}
          className="press min-h-16 flex-row items-center justify-between gap-4 rounded-control bg-surface px-3 py-2.5"
          style={{ boxShadow: 'inset 0 0 0 1px #8a8d99' }}
        >
          <Text className="flex-1 font-body text-[16px] leading-[20.8px]">{current}</Text>
          <Icon name="down" size={20} color={colors.ink} />
        </Pressable>
        {open ? (
          <View
            accessibilityRole="menu"
            className="absolute left-0 top-full z-30 mt-1.5 min-w-full gap-0.5 rounded-[14px] bg-surface p-1.5"
            style={{ boxShadow: '0 10px 30px rgba(36,38,49,0.14)' }}
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => (onChange(o.value), onOpenChange(false))}
                  className={cn('min-h-12 flex-row items-center gap-2 rounded-tile px-3 py-2.5', selected ? 'bg-highlight active:bg-highlight' : 'active:bg-canvas')}
                >
                  <Text className="flex-1 font-body text-[16px] leading-[20.8px]">{o.label}</Text>
                  {selected ? <Icon name="check" size={16} color={colors.ink} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}
