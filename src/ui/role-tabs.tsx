import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/ui/icon';
import { PillTabBar } from '@/ui/pill-tab-bar';

export type TabSpec = { name: string; title: string; icon: IconName };

/** Bottom tabs for any role: same dock, different destinations. `title` is a common.tabs.* key. */
export function RoleTabs({ tabs }: { tabs: TabSpec[] }) {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PillTabBar {...props} />}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: t(`common.tabs.${tab.title}`), tabBarIcon: ({ color, size }) => <Icon name={tab.icon} size={size} color={String(color)} /> }}
        />
      ))}
    </Tabs>
  );
}
