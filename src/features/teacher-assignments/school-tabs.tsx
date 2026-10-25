import { Pressable, View } from 'react-native';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

type Props<T extends string> = { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void };

/** The School page's three-way switch (Тапсырмалар / Сыныптар / Тексеру). */
export function SchoolTabs<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View accessibilityRole="tablist" className="mb-[18px] h-[50px] flex-row gap-1 rounded-[13px] bg-[#f2f6fc] p-1">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            className={cn('flex-1 items-center justify-center rounded-tile px-px', selected && 'bg-surface')}
            style={selected ? { boxShadow: '0 2px 6px rgba(36,38,49,0.035)' } : undefined}
          >
            <Text className={cn('font-body-medium text-[13px] leading-[19px]', selected ? 'text-link' : 'text-subtle')} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
