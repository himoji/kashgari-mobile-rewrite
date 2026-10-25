import Svg, { Circle, Path } from 'react-native-svg';
import { View } from 'react-native';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

export type Status = 'done' | 'failed' | 'pending';

const color: Record<Status, string> = { done: '#2f6b3f', failed: '#a32626', pending: '#656874' };

/** The prototype's status: a small ring (check / cross / dashed) followed by the label. */
export function StatusMark({ status, label, size = 14, className }: { status: Status; label: string; size?: number; className?: string }) {
  const c = color[status];
  return (
    <View className={cn('flex-row items-center gap-[5px]', className)}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} fill={c} fillOpacity={status === 'done' ? 0.06 : 0} />
        <Circle
          cx={12}
          cy={12}
          r={9}
          fill="none"
          stroke={c}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.65}
          strokeDasharray={status === 'pending' ? '2.1 4.97' : undefined}
        />
        {status === 'done' ? (
          <Path d="M7.5 12.25 10.5 15.25 16.75 8.75" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        ) : status === 'failed' ? (
          <Path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        ) : null}
      </Svg>
      <Text className="font-body text-[12px] leading-[16px]" style={{ color: c }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
