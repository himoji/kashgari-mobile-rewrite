import { View } from 'react-native';

import { initials } from '@/ui/avatar';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

/** "7А" in a pale blue rounded tile (class cards and the class page title). */
export function ClassAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <View className={cn('h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef5ff]', className)}>
      <Text className="font-body-semibold text-[20px] leading-[30px] text-[#6d94c9]" numberOfLines={1}>{name}</Text>
    </View>
  );
}

/** The design's quiet 32pt initials circle used in student lists. */
export function StudentAvatar({ name }: { name: string }) {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-[#eef4fd]">
      <Text className="font-body text-[11px] leading-[16.5px] text-[#7d99c2]">{initials(name)}</Text>
    </View>
  );
}
