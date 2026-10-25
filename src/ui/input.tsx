import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

type Props = TextInputProps & { label?: string; error?: string; className?: string };

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, className, ...props }, ref) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="font-body-medium text-[12px] leading-[17px] text-body">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.subtle}
        className={cn(
          'h-[50px] rounded-control border bg-surface px-3.5 font-body text-[16px] text-ink',
          error ? 'border-danger' : 'border-[#dce3ee] focus:border-primary',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error ? <Text variant="caption" tone="danger" accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
});
