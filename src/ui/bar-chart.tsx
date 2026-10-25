import { View } from 'react-native';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

type Props = { points: { label: string; y: number }[]; height?: number; className?: string };

/** Minimal vertical bar chart; enough for the period charts in the design. */
export function BarChart({ points, height = 140, className }: Props) {
  const max = Math.max(1, ...points.map((p) => p.y));
  return (
    <View className={cn('flex-row items-end gap-1.5', className)} style={{ height: height + 22 }}>
      {points.map((p, i) => (
        <View key={`${p.label}-${i}`} className="flex-1 items-center gap-1">
          <View
            className="w-full rounded-t-md bg-primary"
            style={{ height: Math.max(3, (p.y / max) * height) }}
            accessibilityLabel={`${p.label}: ${p.y}`}
          />
          <Text variant="caption" className="text-[10px]" numberOfLines={1}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}
