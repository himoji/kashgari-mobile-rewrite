import { Pressable, View, type PressableProps } from 'react-native';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon, type IconName } from '@/ui/icon';

type Props = Omit<PressableProps, 'children'> & {
  icon: IconName;
  label: string;
  /** glass: on the orange hero; soft: light blue tile; plain: no background. */
  tone?: 'glass' | 'soft' | 'plain';
  size?: number;
  dot?: boolean;
  className?: string;
};

export function IconButton({ icon, label, tone = 'soft', size = 44, dot, className, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{ width: size, height: size }}
      className={cn(
        'items-center justify-center active:opacity-80',
        tone === 'glass' && 'rounded-[14px] bg-white/15 shadow-glass',
        tone === 'soft' && 'rounded-tile bg-track',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={tone === 'glass' ? 19 : 18} color={tone === 'glass' ? colors.white : colors.link} />
      {dot ? (
        <View className="absolute h-[5px] w-[5px] rounded-full bg-attention" style={{ top: 11, right: 12, boxShadow: '0 0 0 1.5px #fff7ec' }} />
      ) : null}
    </Pressable>
  );
}
