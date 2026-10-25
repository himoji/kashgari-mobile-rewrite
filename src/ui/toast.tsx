import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { toastIn, toastOut } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

type Tone = 'info' | 'success' | 'error';
type Toast = { id: number; message: string; tone: Tone };

const useToast = create<{ current: Toast | null }>(() => ({ current: null }));
let lastId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * The prototype's white toast under the app bar, for a moment: a hint, a failure that would otherwise
 * pass silently, or a completed action that has no other confirmation. A new toast replaces the last.
 */
export function showToast(message: string, tone: Tone = 'info') {
  clearTimeout(timer);
  useToast.setState({ current: { id: ++lastId, message, tone } });
  // Android and web read the live region below; VoiceOver needs an announcement.
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  timer = setTimeout(() => useToast.setState({ current: null }), tone === 'error' ? 3200 : 2400);
}

/** Mounted once in the root layout, above every screen. */
export function ToastHost() {
  const toast = useToast((s) => s.current);
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      aria-live="polite"
      style={{ position: 'absolute', left: 40, right: 40, top: Math.max(insets.top, 28) + 42 }}
    >
      {toast ? (
        <Animated.View key={toast.id} entering={still ? undefined : toastIn} exiting={still ? undefined : toastOut}>
          <View
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="flex-row items-center gap-2 rounded-[13px] bg-surface px-[15px] py-3"
            style={{ boxShadow: '0 5px 24px rgba(48,62,88,0.11)' }}
          >
            {toast.tone === 'info' ? null : (
              <Icon name={toast.tone === 'success' ? 'check' : 'close'} size={16} color={toast.tone === 'success' ? colors.success : colors.danger} />
            )}
            <Text className="flex-1 font-body text-[13px] leading-[20px] text-[#6d84a5]">{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
