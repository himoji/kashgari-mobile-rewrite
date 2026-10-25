import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { gradient } from '@/ui/gradient';
import { Icon, type IconName } from '@/ui/icon';
import { Text } from '@/ui/text';

const button = cva('press flex-row items-center justify-center gap-2 rounded-control px-[13px]', {
  variants: {
    variant: {
      primary: 'bg-primary shadow-button active:opacity-90',
      strong: 'bg-primary-strong active:opacity-90',
      attention: 'bg-attention active:opacity-90',
      danger: 'bg-danger-soft active:opacity-80',
      soft: 'bg-track active:opacity-80',
      secondary: 'bg-surface border border-field active:bg-canvas',
      ghost: 'active:bg-canvas',
    },
    size: { md: 'h-11', lg: 'h-12', sm: 'h-9 rounded-tile px-2' },
    block: { true: 'self-stretch' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

const label = {
  primary: 'text-white',
  strong: 'text-white',
  attention: 'text-white',
  danger: 'text-danger',
  soft: 'text-link',
  secondary: 'text-ink',
  ghost: 'text-link',
} as const;

const iconColor = { primary: colors.white, strong: colors.white, attention: colors.white, danger: colors.danger, soft: colors.link, secondary: colors.ink, ghost: colors.link };

export type ButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof button> & {
    label: string;
    icon?: IconName;
    loading?: boolean;
    className?: string;
  };

export function Button({ label: text, icon, loading, variant, size, block, disabled, className, ...props }: ButtonProps) {
  const v = variant ?? 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={cn(button({ variant, size, block }), (disabled || loading) && 'opacity-50', className)}
      style={v === 'primary' ? gradient('sheen') : undefined}
      // The small size is 36pt tall; the slop makes its touch area 44pt.
      hitSlop={size === 'sm' ? 4 : undefined}
      {...props}
    >
      {loading ? <ActivityIndicator color={iconColor[v]} /> : icon ? <Icon name={icon} size={16} color={iconColor[v]} /> : null}
      <Text className={cn('font-body-semibold text-[13px] leading-[18px]', size === 'lg' && 'text-[14px]', label[v])} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {text}
      </Text>
    </Pressable>
  );
}
