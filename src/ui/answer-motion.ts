import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

/** A Pressable that takes Reanimated styles (answer tiles). */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const shake = (x: number) => withTiming(x, { duration: 55 });

/**
 * Motion for an answer tile: a press scale (.97), a short shake when its state turns 'wrong' and a
 * small pop when it turns 'correct'. Only changes animate, so a reviewed attempt renders still.
 * One style carries all three, so tiles skip the `press` class (two transforms would fight).
 * Reanimated drops these under the system's reduce-motion setting.
 */
export function useAnswerMotion(state: string) {
  const previous = useRef(state);
  const x = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    if (state === 'wrong') x.set(withSequence(shake(-6), shake(6), shake(-4), shake(4), shake(0)));
    else if (state === 'correct') scale.set(withSequence(withTiming(1.04, { duration: 120 }), withTiming(1, { duration: 160 })));
  }, [state, x, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scale: scale.get() }] }));
  return {
    style,
    onPressIn: () => scale.set(withTiming(0.97, { duration: 150 })),
    onPressOut: () => scale.set(withTiming(1, { duration: 150 })),
  };
}
