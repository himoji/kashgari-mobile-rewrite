import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming, type WithTimingConfig } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { scheduleOnRN } from 'react-native-worklets';

import { motion } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import { useEscape } from '@/ui/use-escape';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** center: the prototype's floating ds-dialog. sheet: full-width panel from the bottom (pickers). */
  variant?: 'center' | 'sheet';
  className?: string;
};

/**
 * Open/close progress for a modal: the backdrop fades while the panel rises `rise` px (sheet-in /
 * material-rise), and the reverse on close. `mounted` keeps the Modal up until the exit finishes.
 */
export function useModalMotion(visible: boolean, rise: number, timing: WithTimingConfig) {
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(visible ? 1 : 0, visible ? timing : { duration: 180 }, (finished) => {
        if (finished && !visible) scheduleOnRN(setMounted, false);
      }),
    );
  }, [visible, progress, timing]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panel = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0.4, 1]),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [rise, 0]) }],
  }));
  return { mounted, backdrop, panel };
}

/** The prototype's in-place dialog (choices, pickers, confirmations) for state that lives in the current screen. */
export function Dialog({
  visible,
  title,
  onClose,
  children,
  variant = 'center',
  className,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheet = variant === 'sheet';
  useEscape(onClose, visible);
  const { mounted, backdrop, panel } = useModalMotion(visible, sheet ? 32 : 24, sheet ? motion.sheet : motion.dialog);
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View className={cn('flex-1', sheet ? 'justify-end' : 'justify-center px-[30px]')}>
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <Pressable
            accessibilityLabel={t('common.actions.close')}
            className="flex-1 bg-[#24263155]"
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={[{ maxHeight: sheet ? '88%' : '80%' }, panel]}>
          <View
            className={cn(
              'shrink bg-surface',
              sheet
                ? 'rounded-t-[26px] px-5 pt-5'
                : 'rounded-[22px] p-[18px]',
              className,
            )}
            style={{
              boxShadow: sheet
                ? '0 -12px 48px rgba(34,50,72,0.125)'
                : '0 18px 65px rgba(34,50,72,0.19)',
              paddingBottom: sheet ? insets.bottom + 24 : undefined,
            }}
          >
            <View
              className={cn(
                'flex-row items-center justify-between gap-2.5',
                sheet ? 'mb-3.5 pb-[15px] pt-2.5' : 'mb-[18px] pb-2.5 pt-0.5',
              )}
            >
              <Text
                className={cn(
                  'flex-1 font-body-medium text-ink',
                  sheet ? 'text-[20px] leading-[26px]' : 'text-[18px] leading-[25px]',
                )}
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.actions.close')}
                hitSlop={8}
                onPress={onClose}
                className={cn(
                  'press h-8 w-8 items-center justify-center bg-[#f3f6fb] active:opacity-80',
                  sheet ? 'rounded-full' : 'rounded-tile',
                )}
              >
                <Icon name="close" size={16} color={colors.subtle} />
              </Pressable>
            </View>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** One option in a dialog's choice list (class, grade, period): blue with a check when chosen, grey dot otherwise. */
export function ChoiceRow({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'press-row min-h-12 flex-row items-center gap-3 rounded-control px-3 py-[13px] active:opacity-80',
        selected ? 'bg-tile' : 'bg-[#f7f9fc]',
        disabled && 'opacity-50',
      )}
    >
      <Text
        className={cn(
          'flex-1 font-body text-[13px] leading-[20px]',
          selected ? 'text-link' : 'text-[#697b96]',
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? (
        <Icon name="check" size={18} color={colors.link} />
      ) : (
        <View className="h-[15px] w-[15px] rounded-full bg-[#e8eef6]" />
      )}
    </Pressable>
  );
}
