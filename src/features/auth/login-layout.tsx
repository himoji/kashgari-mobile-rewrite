import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradient } from '@/ui/gradient';

/** Login pages: soft orange/blue corners, logo, one column, actions pinned to the bottom. */
export function LoginLayout({ children, footer, logo = true }: { children: ReactNode; footer?: ReactNode; logo?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface" style={gradient('login')}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Math.max(insets.top + 40, 89), paddingHorizontal: 44, paddingBottom: 180 }}>
        {logo ? (
          <Image source={require('@/assets/images/logo.png')} style={{ width: 150, height: 36, marginBottom: 54 }} contentFit="contain" contentPosition="left" />
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <KeyboardStickyView offset={{ opened: insets.bottom - 8 }}>
          <View className="gap-1 px-6" style={{ paddingBottom: insets.bottom + 20 }}>
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}
