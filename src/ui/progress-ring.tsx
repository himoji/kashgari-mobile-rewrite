import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { motion } from '@/lib/motion';
import { Text } from '@/ui/text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { value: number; size?: number; stroke?: number; label?: string; color?: string; track?: string };

/** Ring with the percentage in the middle. `value` is 0..1; the arc sweeps to it on the UI thread. */
export function ProgressRing({ value, size = 108, stroke = 10, label, color = '#ffffff', track = 'rgba(255,255,255,0.3)' }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.set(withTiming(pct / 100, motion.progress));
  }, [pct, sweep]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - sweep.get()) }));
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center" accessibilityLabel={`${pct}%`}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={arc}
        />
      </Svg>
      <Text className="font-body-medium text-[27px] leading-[33px]" style={{ color }}>
        {pct}
        <Text className="font-body-medium text-[13px]" style={{ color }}> %</Text>
      </Text>
      {label ? <Text className="mt-0.5 font-body text-[10px] leading-[15px] opacity-90" style={{ color }}>{label}</Text> : null}
    </View>
  );
}
