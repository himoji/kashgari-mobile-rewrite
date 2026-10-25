import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';

/** The design's search box: pale field, 48pt tall, magnifier on the left. */
export function SearchField({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <View className={cn('h-12 flex-row items-center rounded-[14px] bg-[#f7f9fd] pl-[14px] pr-3', className)}>
      <Icon name="search" size={20} color={colors.ink} />
      <TextInput
        placeholderTextColor={colors.subtle}
        accessibilityRole="search"
        returnKeyType="search"
        className="h-12 flex-1 pl-2.5 font-body text-[14px] text-ink"
        style={{ outlineStyle: 'none' } as object}
        {...props}
      />
    </View>
  );
}
