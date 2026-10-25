import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { cn } from '@/ui/cn';

// panel: sections with a heading (profile, settings). item: list entries (assignments). blue: progress/feature cards.
const card = cva('', {
  variants: {
    variant: {
      panel: 'rounded-card bg-surface p-[14px] shadow-panel',
      item: 'rounded-[16.5px] bg-surface p-[13px] shadow-item',
      action: 'min-h-[88px] justify-center rounded-card bg-surface px-[14px] py-[17px] shadow-card',
      blue: 'rounded-[20px] bg-primary sheen px-[15px] py-[17px] shadow-blue',
      muted: 'rounded-card bg-canvas p-[14px]',
    },
  },
  defaultVariants: { variant: 'panel' },
});

type CardVariant = VariantProps<typeof card>;

export function Card({ variant, className, ...props }: ViewProps & CardVariant & { className?: string }) {
  return <View className={cn(card({ variant }), className)} {...props} />;
}

/** A card that is one tap target (the design's "whole card is the action" rule). */
export function PressableCard({ variant, className, ...props }: PressableProps & CardVariant & { className?: string }) {
  return <Pressable accessibilityRole="button" className={cn(card({ variant }), 'active:opacity-80', className)} {...props} />;
}
