import { Tabs } from 'expo-router';
import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';
import { Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Icon, type IconName } from '@/ui/icon';
import { PillTabBar } from '@/ui/pill-tab-bar';

export type TabSpec = { name: string; title: string; icon: IconName };
/** A page that keeps the dock but has no tab of its own: `parent` is the tab it lights up. */
export type TabPage = { name: string; parent: string };

/**
 * The prototype's page change (micro.js enhance): the new page rises 6px from 35% opacity over 440ms,
 * the old one leaves at once. Native-driver animated, so it stays off the JS thread.
 */
const pageChange: BottomTabNavigationOptions = {
  animation: 'fade',
  transitionSpec: { animation: 'timing', config: { duration: 440, easing: Easing.bezier(0.22, 0.68, 0.16, 1) } },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({ inputRange: [-1, -0.3, 0, 0.99, 1], outputRange: [0, 0, 1, 0.35, 0] }),
      transform: [{ translateY: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 0, 6] }) }],
    },
  }),
};

/** Bottom tabs for any role: same dock, different destinations. `title` is a common.tabs.* key. */
export function RoleTabs({ tabs, pages = [] }: { tabs: TabSpec[]; pages?: TabPage[] }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const parents = Object.fromEntries(pages.map((p) => [p.name, p.parent]));
  return (
    <Tabs
      backBehavior="history"
      screenOptions={reduceMotion ? { headerShown: false } : { headerShown: false, ...pageChange }}
      tabBar={(props) => <PillTabBar {...props} parents={parents} />}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: t(`common.tabs.${tab.title}`), tabBarIcon: ({ color, size }) => <Icon name={tab.icon} size={size} color={String(color)} /> }}
        />
      ))}
      {pages.map((page) => (
        <Tabs.Screen key={page.name} name={page.name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
