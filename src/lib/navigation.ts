import { router, useNavigation, type Href } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';

/** Goes back, or to `fallback` when the screen was opened directly (a link or a reload). */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * Holds the screen while `dirty` (unsaved answers or edits): the back link, Android's back button,
 * the iOS swipe and a `replace` all stop, and `asking` turns true so the screen shows its confirm.
 * `leave` continues the navigation that was stopped; `stay` drops it. Call `release` right before
 * navigating away on purpose (after a successful submit), since `dirty` only clears on the next render.
 */
export function useLeaveGuard(dirty: boolean) {
  const navigation = useNavigation();
  const [pending, setPending] = useState<NavigationAction | null>(null);
  const [leaving, setLeaving] = useState<NavigationAction | null>(null);
  const released = useRef(false);
  usePreventRemove(dirty && !leaving, ({ data }) => (released.current ? setLeaving : setPending)(data.action));

  // Sent once the guard is off, by the navigator the action names: from this screen's own stack, a
  // `replace` aimed at the root (goBack on a screen opened by a link) does nothing.
  useEffect(() => {
    if (!leaving) return;
    let owner: typeof navigation | undefined = navigation;
    while (owner && leaving.target && owner.getState()?.key !== leaving.target) owner = owner.getParent();
    (owner ?? navigation).dispatch(leaving);
  }, [leaving, navigation]);

  return {
    asking: pending != null,
    stay: () => setPending(null),
    leave: () => {
      setLeaving(pending);
      setPending(null);
    },
    release: (on = true) => {
      released.current = on;
    },
  };
}
