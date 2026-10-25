import { View } from 'react-native';

import { Text } from '@/ui/text';

/** Label/value pairs (the design's definition list in profile panels). Empty values are skipped. */
export function Facts({ items }: { items: { label: string; value?: string | null }[] }) {
  return (
    <View className="my-4">
      {items
        .filter((i) => i.value)
        .map((i) => (
          <View key={i.label} className="py-3 pr-10">
            <Text className="mb-[5px] font-body text-[11px] leading-[16.5px] text-subtle">{i.label}</Text>
            <Text variant="small">{i.value}</Text>
          </View>
        ))}
    </View>
  );
}
