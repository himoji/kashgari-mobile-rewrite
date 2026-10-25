import { RoleTabs } from '@/ui/role-tabs';

export default function Tabs() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'home', icon: 'solid-home' },
        { name: 'league', title: 'league', icon: 'solid-trophy' },
        { name: 'school', title: 'school', icon: 'solid-classes' },
        { name: 'profile', title: 'profile', icon: 'solid-profile' },
      ]}
      pages={[
        { name: 'words', parent: 'index' },
        { name: 'rankings', parent: 'league' },
        { name: 'results', parent: 'school' },
      ]}
    />
  );
}
