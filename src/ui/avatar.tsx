import { View } from 'react-native';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

export const initials = (name: string) =>
  name.split(/\s+/).map((n) => n.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean).slice(0, 2).map((c) => c!.toUpperCase()).join('');

/** Round initials avatar; `square` is the 38pt rounded tile used in account lists. */
export function Avatar({ name, size = 44, square, className }: { name: string; size?: number; square?: boolean; className?: string }) {
  return (
    <View
      style={{ width: size, height: size }}
      className={cn('items-center justify-center bg-primary-soft', square ? 'rounded-control' : 'rounded-full', className)}
    >
      <Text className="font-body text-[14px] text-link" style={{ fontSize: Math.round(size * 0.32) }}>{initials(name)}</Text>
    </View>
  );
}
