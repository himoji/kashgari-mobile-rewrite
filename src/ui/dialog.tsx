import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** center: the prototype's floating ds-dialog. sheet: full-width panel from the bottom (pickers). */
  variant?: 'center' | 'sheet';
  className?: string;
};

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className={cn('flex-1', sheet ? 'justify-end' : 'justify-center px-[30px]')}>
        <Pressable
          accessibilityLabel={t('common.actions.close')}
          className="absolute inset-0 bg-[#24263155]"
          onPress={onClose}
        />
        <View
          className={cn(
            'bg-surface',
            sheet
              ? 'max-h-[88%] rounded-t-[26px] px-5 pt-5'
              : 'max-h-[80%] rounded-[22px] p-[18px]',
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
                'h-8 w-8 items-center justify-center bg-[#f3f6fb]',
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
        'min-h-12 flex-row items-center gap-3 rounded-control px-3 py-[13px] active:opacity-80',
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
