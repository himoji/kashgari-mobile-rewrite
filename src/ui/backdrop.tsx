import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet } from 'react-native';

/** The design's dialog backdrop: a tint over the blurred page. Tapping it closes the dialog. */
export function Backdrop({ color, blur, label, onPress }: { color: string; blur: number; label: string; onPress?: () => void }) {
  const web = Platform.OS === 'web';
  return (
    <>
      {/* expo-blur tints its web view white, so web uses the CSS filter. Android shows the tint only (its blur needs a BlurTargetView). */}
      {web ? null : <BlurView intensity={blur * 5} tint="default" style={StyleSheet.absoluteFill} />}
      <Pressable
        accessibilityLabel={label}
        style={[StyleSheet.absoluteFill, { backgroundColor: color }, web && ({ backdropFilter: `blur(${blur}px)` } as object)]}
        onPress={onPress}
        disabled={!onPress}
      />
    </>
  );
}
