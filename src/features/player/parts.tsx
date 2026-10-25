import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon, type IconName } from '@/ui/icon';
import { Text } from '@/ui/text';

/** Leaves a focused screen; opened from a deep link it falls back to the school tab. */
export function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/student/school');
}

export const openWord = (word: string) => router.push({ pathname: '/word', params: { word } });

/** The focused-screen header from the design: a back pill with the section name. */
export function FocusHeader({ label, onBack }: { label: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-surface px-5 pb-[10px]" style={{ paddingTop: Math.max(insets.top, 28) + 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onBack ?? leave}
        className="h-11 flex-row items-center gap-1.5 self-start rounded-[24px] pl-2 pr-3 active:bg-canvas"
      >
        <View className="h-[22px] w-[22px] items-center justify-center">
          <Icon name="back" size={20} color={colors.ink} />
        </View>
        <Text className="font-body-medium text-[12px] leading-[18px] text-body">{label}</Text>
      </Pressable>
    </View>
  );
}

export function StepHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('mb-4 font-body-semibold text-[17px] leading-[24px] text-ink', className)}>{children}</Text>;
}

export function Prompt({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('mb-[10px] mt-4 font-body-semibold text-[16px] leading-[23px] text-ink', className)}>{children}</Text>;
}

export function Instruction({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('mb-3 font-body text-[15px] leading-[23.25px] text-ink', className)}>{children}</Text>;
}

/** Grey word chip; tappable chips open the dictionary sheet. */
export function WordChip({ word, onPress, large, dim }: { word: string; onPress?: () => void; large?: boolean; dim?: boolean }) {
  const content = useContentText();
  const label = (
    <Text className={cn('font-body text-ink', large ? 'text-[22px] leading-[20px]' : 'text-[14px] leading-[20px]')}>{content(word)}</Text>
  );
  const className = cn('justify-center rounded-tile bg-[#f3f5f2] px-[11px]', large ? 'min-w-[35px] items-center py-2' : 'py-2', dim && 'opacity-35');
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={dim} className={cn(className, 'min-h-[44px] active:opacity-70')}>
      {label}
    </Pressable>
  ) : (
    <View className={className}>{label}</View>
  );
}

export function Chips({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('flex-row flex-wrap gap-1.5', className)}>{children}</View>;
}

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong';

const optionBox: Record<OptionState, string> = {
  idle: 'border-transparent bg-surface',
  selected: 'border-transparent bg-[#eef5ff]',
  correct: 'border-[#2f6b3f] bg-[#edf8ef]',
  wrong: 'border-danger bg-danger-soft',
};
const optionText: Record<OptionState, string> = {
  idle: 'text-[#343845]',
  selected: 'text-[#1558ac]',
  correct: 'text-[#2f6b3f]',
  wrong: 'text-late',
};
const letterBox: Record<OptionState, string> = {
  idle: 'bg-[#f1f5fb]',
  selected: 'bg-primary-strong',
  correct: 'bg-[#2f6b3f]',
  wrong: 'bg-danger',
};

/** The A/B/C answer row (or a plain row for true/false when `letter` is omitted). */
export function OptionRow({
  letter,
  label,
  state,
  onPress,
  className,
}: {
  letter?: string;
  label: string;
  state: OptionState;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: state === 'selected', disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn('min-h-[52px] flex-row items-center gap-[10px] rounded-[13px] border px-3 py-[11px]', optionBox[state], className)}
      style={{ boxShadow: state === 'selected' ? '0 0 0 1px rgba(59,134,255,0.125)' : '0 2px 3px rgba(36,38,49,0.01)' }}
    >
      {letter ? (
        <View className={cn('h-[26px] w-[26px] items-center justify-center rounded-[8px]', letterBox[state])}>
          <Text className={cn('font-body-semibold text-[12px] leading-[20px]', state === 'idle' ? 'text-[#8a95a7]' : 'text-white')}>{letter}</Text>
        </View>
      ) : null}
      <Text className={cn('flex-1 font-body text-[14px] leading-[20px]', optionText[state])}>{label}</Text>
      {state === 'correct' ? <Icon name="check" size={18} color="#2f6b3f" /> : state === 'wrong' ? <Icon name="close" size={18} color={colors.danger} /> : null}
    </Pressable>
  );
}

/** Light input field used by the exercises (scrambled word, gap, open answer). */
export function AnswerInput({ className, multiline, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#8f96a3"
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      autoCorrect={false}
      className={cn(
        'rounded-[11px] border border-transparent bg-[#f7f9fd] px-3 py-[10px] font-body text-[16px] text-ink focus:border-primary',
        multiline ? 'min-h-[214px]' : 'h-[46px]',
        className,
      )}
      {...props}
    />
  );
}

/** The student's own written answer in review. */
export function ResponseBox({ text, empty }: { text?: string | null; empty: string }) {
  const content = useContentText();
  return (
    <View className="mb-3 rounded-[14px] bg-[#f4f8fd] p-4">
      <Text className={cn('font-reading text-[16px] leading-[26px]', text ? 'text-[#303c50]' : 'text-subtle')}>{text ? content(text) : empty}</Text>
    </View>
  );
}

/** Small "correct answer: …" line under a reviewed item. */
export function CorrectLine({ label, value }: { label: string; value: string }) {
  const content = useContentText();
  return (
    <Text className="mt-2 font-body text-[13px] leading-[19px] text-[#2f6b3f]">
      {label}: <Text className="font-body-semibold text-[13px] text-[#2f6b3f]">{content(value)}</Text>
    </Text>
  );
}

export function SoftIconButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={cn('h-11 w-11 items-center justify-center rounded-control bg-[#f2f7ff] active:opacity-70', disabled && 'opacity-40')}
    >
      <Icon name={icon} size={19} color={colors.ink} />
    </Pressable>
  );
}
