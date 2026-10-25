import { Easing, FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';

/**
 * Durations and curves from the prototype (assets/app.css tokens, motion/micro.js). Reanimated's
 * withTiming and layout animations skip themselves under the system's reduce-motion setting.
 */
export const motion = {
  /** Answer and selection colours (.exercise option). */
  tone: 180,
  /** Content that arrives after loading. */
  fade: 180,
  /** Dock pill slide (app.js). */
  dock: { duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  /** Segment pill (micro.js movePill). */
  segment: { duration: 620, easing: Easing.bezier(0.22, 0.68, 0.16, 1) },
  /** Page, tab-panel and step change: opacity .35→1, 6px rise (micro.js enhance / transitionPanel). */
  page: { duration: 440, easing: Easing.bezier(0.22, 0.68, 0.16, 1) },
  /** Dialog rise (sheet-in). */
  dialog: { duration: 260, easing: Easing.bezier(0.2, 0.8, 0.3, 1) },
  /** Bottom sheet rise (material-rise). */
  sheet: { duration: 220, easing: Easing.out(Easing.ease) },
  /** Progress fills and rings. */
  progress: { duration: 420, easing: Easing.bezier(0.23, 1, 0.32, 1) },
} as const;

/** A step, page or panel coming in: from 35% opacity, 6px lower (micro.js enhance). For keyed views. */
export const pageIn = new Keyframe({
  0: { opacity: 0.35, transform: [{ translateY: 6 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: motion.page.easing },
}).duration(motion.page.duration);

/** Tab-panel change: from 45% opacity, 4px lower (micro.js transitionPanel). */
export const panelIn = new Keyframe({
  0: { opacity: 0.45, transform: [{ translateY: 4 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: motion.page.easing },
}).duration(motion.page.duration);

/** Loaded content replacing its skeleton. */
export const contentIn = FadeIn.duration(motion.fade);

/** Toasts fade in and out over 200ms (app.css .toast). */
export const toastIn = FadeIn.duration(200);
export const toastOut = FadeOut.duration(200);

/** sheet-in: a dialog card rises 24px from 40% opacity (app.css .ds-dialog). */
export const dialogIn = new Keyframe({
  0: { opacity: 0.4, transform: [{ translateY: 24 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: motion.dialog.easing },
}).duration(motion.dialog.duration);
