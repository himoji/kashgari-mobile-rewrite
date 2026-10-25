import { useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming, type WithTimingConfig } from 'react-native-reanimated';

type Frame = { x: number; width: number };

/**
 * The prototype's moving pill (dock, segmented tabs): one absolutely placed view that slides to the
 * active item instead of each item swapping its own background. Give every item `measure(key)` as
 * onLayout and render the pill with `style` (left 0, behind the items).
 */
export function useSlidingPill(active: string, timing: WithTimingConfig) {
  const [frames, setFrames] = useState<Record<string, Frame>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const frame = frames[active];

  useEffect(() => {
    if (!frame) return;
    // The first placement jumps; later ones slide.
    if (width.get() === 0) {
      x.set(frame.x);
      width.set(frame.width);
    } else {
      x.set(withTiming(frame.x, timing));
      width.set(withTiming(frame.width, timing));
    }
  }, [frame, timing, x, width]);

  const style = useAnimatedStyle(() => ({
    width: width.get(),
    opacity: width.get() === 0 ? 0 : 1,
    transform: [{ translateX: x.get() }],
  }));

  const measure = (key: string) => (e: LayoutChangeEvent) => {
    const { x: left, width: w } = e.nativeEvent.layout;
    setFrames((f) => (f[key]?.x === left && f[key]?.width === w ? f : { ...f, [key]: { x: left, width: w } }));
  };

  return { style, measure };
}
