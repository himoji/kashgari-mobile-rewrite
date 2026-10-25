import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

const mascots = {
  home: require('@/assets/images/mascot/home.webp'),
  learning: require('@/assets/images/mascot/learning.webp'),
  results: require('@/assets/images/mascot/results.webp'),
  settings: require('@/assets/images/mascot/settings.webp'),
};
export type MascotPose = keyof typeof mascots;

/** The white dot grid that fades out from the top right of the hero. */
function HeroPattern() {
  return (
    <Svg
      width="100%"
      height={210}
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id="dots" width={9} height={9} patternUnits="userSpaceOnUse">
          <Circle cx={4.5} cy={4.5} r={2.5} fill="#ffffff" fillOpacity={0.36} />
        </Pattern>
        <RadialGradient id="fade" cx="75%" cy="10%" rx="75%" ry="90%">
          <Stop offset="0.15" stopColor="#fff" stopOpacity={1} />
          <Stop offset="0.8" stopColor="#fff" stopOpacity={0} />
        </RadialGradient>
        <Mask id="mask">
          <Rect width="100%" height="100%" fill="url(#fade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" mask="url(#mask)" />
    </Svg>
  );
}

type Props = {
  title: string;
  /** Omitted on pages the design shows without the squirrel (teacher School, Reports). */
  mascot?: MascotPose;
  /** Top-right buttons on the orange hero (IconButton tone="glass"). */
  actions?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
};

/** Every bottom-tab page: orange workspace, title with the squirrel, white sheet of content above the dock. */
export function TabScreen({
  title,
  mascot,
  actions,
  children,
  refreshing,
  onRefresh,
  className,
}: Props) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 20) + 10;
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#fff" />
          ) : undefined
        }
      >
        <View className="bg-workspace absolute inset-x-0 top-0 h-[284px]" />
        <HeroPattern />
        <View
          className="h-11 flex-row items-center justify-end gap-1.5 px-5"
          style={{ marginTop: top }}
        >
          {actions}
        </View>
        <View className="mx-[14px] -mt-2 h-32 flex-row items-center px-1.5 pb-[18px] pt-2.5">
          <Text variant="display" tone="inverse" className="flex-1" numberOfLines={2}>
            {title}
          </Text>
          {mascot ? (
            <Image
              source={mascots[mascot]}
              style={{
                width: 144,
                height: 128,
                marginRight: -9,
                marginTop: -10,
                marginBottom: -18,
              }}
              contentFit="contain"
            />
          ) : null}
        </View>
        <View className={cn('mx-[14px] gap-3 rounded-sheet bg-surface p-2.5', className)}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
