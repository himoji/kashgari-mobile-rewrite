import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

/** The floating dock from the design: the active tab grows into a blue pill with its label. */
export function PillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 14);
  return (
    <>
      <View pointerEvents="none" className="bg-dock-fade absolute inset-x-0 bottom-0" style={{ height: bottom + 94 }} />
      <View
        className="bg-dock absolute inset-x-[14px] h-[66px] flex-row items-center justify-between gap-1 rounded-[14px] border border-white/60 p-2 shadow-dock"
        style={{ bottom }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          if ((options as { href?: unknown }).href === null) return null;
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              className={cn(
                'h-12 flex-row items-center justify-center gap-2 rounded-tile',
                focused ? 'bg-primary-strong sheen px-2.5' : 'w-12',
              )}
              style={focused ? { boxShadow: '0 2px 5px rgba(10,116,255,0.18)' } : undefined}
            >
              {options.tabBarIcon?.({ focused, color: focused ? colors.white : colors.primaryStrong, size: 24 })}
              {focused ? (
                <Text className="font-body text-[14px] leading-[17px] text-white" numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
