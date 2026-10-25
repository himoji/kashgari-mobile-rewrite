import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';

/** The prototype's centred dialog (word detail, reading guide): tinted backdrop, white card, close in the corner. */
export function DialogCard({
  onClose,
  children,
  className,
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Pressable
        accessibilityLabel={t('common.actions.close')}
        className="absolute inset-0 bg-[#30415a38]"
        onPress={onClose}
      />
      <View
        accessibilityViewIsModal
        className={cn('w-full max-w-[310px] rounded-sheet bg-surface px-5 pb-5 pt-12', className)}
        style={{ boxShadow: '0 18px 65px rgba(34, 50, 72, 0.19)' }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.actions.close')}
          onPress={onClose}
          hitSlop={6}
          className="absolute right-2.5 top-2.5 h-8 w-8 items-center justify-center rounded-tile bg-[#f3f6fb] active:opacity-80"
        >
          <Icon name="close" size={16} color={colors.subtle} />
        </Pressable>
        {children}
      </View>
    </View>
  );
}
