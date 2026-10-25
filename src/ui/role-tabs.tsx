import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/ui/icon';
import { PillTabBar } from '@/ui/pill-tab-bar';

export type TabSpec = { name: string; title: string; icon: IconName };
/** A page that keeps the dock but has no tab of its own: `parent` is the tab it lights up. */
export type TabPage = { name: string; parent: string };

/** Bottom tabs for any role: same dock, different destinations. `title` is a common.tabs.* key. */
export function RoleTabs({ tabs, pages = [] }: { tabs: TabSpec[]; pages?: TabPage[] }) {
  const { t } = useTranslation();
  const parents = Object.fromEntries(pages.map((p) => [p.name, p.parent]));
  return (
    <Tabs backBehavior="history" screenOptions={{ headerShown: false }} tabBar={(props) => <PillTabBar {...props} parents={parents} />}>
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
