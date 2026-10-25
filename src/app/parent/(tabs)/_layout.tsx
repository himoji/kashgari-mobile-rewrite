import { RoleTabs } from '@/ui/role-tabs';

export default function Tabs() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'home', icon: 'solid-home' },
        { name: 'profile', title: 'profile', icon: 'solid-profile' },
      ]}
    />
  );
}
