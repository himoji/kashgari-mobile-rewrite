import { Platform, type ViewStyle } from 'react-native';

/**
 * The design's background gradients, applied as a style string. They are not CSS utilities because
 * react-native-css 3.0.7 compiles `background-image` into an array of strings, which React Native's
 * native processBackgroundImage crashes on ("Cannot read property 'length' of undefined").
 */
const gradients = {
  /** The diagonal light sweep on every blue surface (buttons, progress cards, active pills). */
  sheen: 'linear-gradient(112deg, transparent 8%, rgba(255, 255, 255, 0.19) 29%, rgba(255, 255, 255, 0.04) 49%, transparent 67%)',
  /** Orange workspace behind every tab: fades to white under the hero. */
  workspace: 'linear-gradient(180deg, #ff8d22 0px, #ffbf83 130px, #ffffff 284px)',
  dock: 'linear-gradient(107deg, rgba(255, 255, 255, 0.85) 9.66%, rgba(198, 232, 255, 0.78) 154.53%)',
  dockFade: 'linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5) 60%)',
  login: 'radial-gradient(ellipse at 5% 0%, #fff0df 0, transparent 48%), radial-gradient(ellipse at 100% 100%, #e8f3ff 0, transparent 45%)',
  result: 'radial-gradient(ellipse at 20% 0%, rgba(255, 255, 255, 0.14), transparent 65%)',
  /** Blue flashcards. */
  card: 'linear-gradient(140deg, #4a93ff, #1e75f4)',
  /** White rising behind a floating action at the bottom of a list. */
  fadeUp: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffffff 25%)',
  /** Rankings podium stands: first, second, third. */
  gold: 'linear-gradient(110deg, #ffe9a3, #f5d475)',
  silver: 'linear-gradient(110deg, #f0f4fc, #dce4f0)',
  bronze: 'linear-gradient(110deg, #fbede3, #ecccb3)',
} as const;

export type GradientName = keyof typeof gradients;

const styles = Object.fromEntries(
  Object.entries(gradients).map(([name, value]) => [
    name,
    (Platform.OS === 'web' ? { backgroundImage: value } : { experimental_backgroundImage: value }) as ViewStyle,
  ]),
) as Record<GradientName, ViewStyle>;

/** `style={gradient('sheen')}` */
export function gradient(name: GradientName): ViewStyle {
  return styles[name];
}
