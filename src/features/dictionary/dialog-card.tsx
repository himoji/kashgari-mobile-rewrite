import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { Backdrop } from '@/ui/backdrop';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { useEscape } from '@/ui/use-escape';

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
  useEscape(onClose);
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Backdrop color="#30415a38" blur={8} label={t('common.actions.close')} onPress={onClose} />
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
