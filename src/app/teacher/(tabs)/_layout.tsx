import { RoleTabs } from '@/ui/role-tabs';

export default function Tabs() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'home', icon: 'solid-home' },
        { name: 'materials', title: 'materials', icon: 'solid-book' },
        { name: 'school', title: 'school', icon: 'solid-classes' },
        { name: 'profile', title: 'profile', icon: 'solid-profile' },
      ]}
    />
  );
}
