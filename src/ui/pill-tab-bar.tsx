import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/lib/haptics';
import { motion } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { useSlidingPill } from '@/ui/sliding-pill';
import { Text } from '@/ui/text';

/** Dock height; pages pad their content by this plus the bottom inset so the dock never covers it. */
export const DOCK_HEIGHT = 56;
export const dockBottom = (insetBottom: number) => Math.max(insetBottom, 12);

/**
 * The floating dock from the design, compact and labelled: every tab shows its name, the active one
 * sits in the blue pill, which slides between tabs (app.js, 380ms). `parents` maps dock pages to their
 * tab. Tapping the open tab scrolls it to the top (TabScreen listens for the tabPress).
 */
export function PillTabBar({ state, descriptors, navigation, parents = {} }: BottomTabBarProps & { parents?: Record<string, string> }) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]!.name;
  const active = parents[current] ?? current;
  const bottom = dockBottom(insets.bottom);
  const pill = useSlidingPill(active, motion.dock);
  return (
    <>
      <View pointerEvents="none" className="bg-dock-fade absolute inset-x-0 bottom-0" style={{ height: bottom + DOCK_HEIGHT + 24 }} />
      <View
        className="bg-dock absolute inset-x-[14px] flex-row items-center gap-1 rounded-[14px] border border-white/60 p-1.5 shadow-dock"
        style={{ bottom, height: DOCK_HEIGHT }}
      >
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 6, bottom: 6, left: 0 }, pill.style]}>
          <View className="bg-primary-strong sheen flex-1 rounded-[10px]" style={{ boxShadow: '0 2px 5px rgba(10,116,255,0.18)' }} />
        </Animated.View>
        {state.routes.map((route) => {
          // Dock pages have no button of their own.
          if (parents[route.name]) return null;
          const { options } = descriptors[route.key]!;
          const focused = route.name === active;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (route.name !== current && !event.defaultPrevented) {
              if (!focused) haptics.selection();
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLayout={pill.measure(route.name)}
              className="press h-full flex-1 items-center justify-center gap-0.5 rounded-[10px] px-1"
            >
              {options.tabBarIcon?.({ focused, color: focused ? colors.white : colors.primaryStrong, size: 20 })}
              <Text
                className={cn('font-body text-[10px] leading-[13px]', focused ? 'font-body-medium text-white' : 'text-primary-strong')}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
