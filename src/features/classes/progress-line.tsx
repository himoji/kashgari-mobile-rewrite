import { View } from 'react-native';

import { cn } from '@/ui/cn';

type Props = { pct: number; className?: string; tone?: 'soft' | 'strong'; height?: number };

/** Thin completion bar: soft (assignment cards) or strong blue (report modules). */
export function ProgressLine({ pct, className, tone = 'soft', height = 4 }: Props) {
  const width = `${Math.max(0, Math.min(100, pct))}%` as const;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      className={cn('overflow-hidden rounded', tone === 'soft' ? 'bg-[#edf3fc]' : 'bg-[#e6efff]', className)}
      style={{ height }}
    >
      <View className={cn('h-full rounded', tone === 'soft' ? 'bg-[#78a9f6]' : 'bg-primary')} style={{ width }} />
    </View>
  );
}
