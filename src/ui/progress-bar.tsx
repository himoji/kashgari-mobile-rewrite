import { useEffect } from 'react';
import { StyleSheet, View, type AccessibilityValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion } from '@/lib/motion';
import { cn } from '@/ui/cn';

type Props = {
  /** 0..1 */
  value: number;
  /** The track: height, radius, colour. */
  className?: string;
  /** The fill: radius, colour. */
  fillClassName?: string;
  accessibilityLabel?: string;
  accessibilityValue?: AccessibilityValue;
};

/**
 * A thin progress bar whose fill slides in from the left on the UI thread: the full-width fill moves
 * with translateX inside the clipped track (no width animation, and its rounded end keeps its shape).
 */
export function ProgressBar({ value, className, fillClassName, accessibilityLabel, accessibilityValue }: Props) {
  const clamped = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(0);
  const width = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(clamped, motion.progress));
  }, [clamped, progress]);

  const fill = useAnimatedStyle(() => ({
    opacity: width.get() === 0 ? 0 : 1,
    transform: [{ translateX: (progress.get() - 1) * width.get() }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue ?? { min: 0, max: 100, now: Math.round(clamped * 100) }}
      onLayout={(e) => width.set(e.nativeEvent.layout.width)}
      className={cn('overflow-hidden', className)}
    >
      <Animated.View style={[StyleSheet.absoluteFill, fill]}>
        <View className={cn('flex-1', fillClassName)} />
      </Animated.View>
    </View>
  );
}
