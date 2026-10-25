import { KeyboardStickyView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

/** KEYBOARD_TOOLBAR_HEIGHT in react-native-keyboard-controller (not exported). */
const DONE_BAR = 42;

/** Number pads have no return key: a Done bar rides on the keyboard while `visible` (a number field is focused). */
export function NumberPadDone({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  return <KeyboardToolbar enabled={visible} showArrows={false} doneText={t('common.actions.done')} />;
}

/**
 * A screen's pinned footer (Save, Next) that rides on the keyboard instead of hiding under it. Its
 * own bottom padding covers the home indicator, so that part is dropped while the keyboard is up;
 * `aboveDone` lifts it over a visible `NumberPadDone`.
 */
export function KeyboardFooter({ aboveDone = false, children }: { aboveDone?: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardStickyView
      offset={{ opened: insets.bottom - (aboveDone ? DONE_BAR : 0) }}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
    >
      {children}
    </KeyboardStickyView>
  );
}
