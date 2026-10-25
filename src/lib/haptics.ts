import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS !== 'web';
const run = (play: () => Promise<void>) => {
  if (on) play().catch(() => undefined);
};

/**
 * Taptic feedback for the moments the prototype marks with motion: a choice changing, an answer
 * landing, a wrong code. Not for every button press, scrolls or timers. A no-op on web.
 */
export const haptics = {
  /** A tab, segment or option changed. */
  selection: () => run(Haptics.selectionAsync),
  /** A correct answer, a finished game, a successful submit. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A wrong answer or code. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** A primary action that starts something (start a game, send). */
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
};
