// Per-weight subpaths: the package index requires every weight, which ships unused TTFs.
import { GolosText_400Regular } from '@expo-google-fonts/golos-text/400Regular';
import { GolosText_500Medium } from '@expo-google-fonts/golos-text/500Medium';
import { Onest_400Regular } from '@expo-google-fonts/onest/400Regular';
import { Onest_500Medium } from '@expo-google-fonts/onest/500Medium';
import { Onest_600SemiBold } from '@expo-google-fonts/onest/600SemiBold';
import { Onest_700Bold } from '@expo-google-fonts/onest/700Bold';

/** Passed to `useFonts` once in the root layout. Family names match the `font-*` theme tokens. */
export const fonts = {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  GolosText_400Regular,
  GolosText_500Medium,
  KZDusha: require('@/assets/fonts/KZDusha.ttf'),
  KZBip: require('@/assets/fonts/KZBip.ttf'),
};
