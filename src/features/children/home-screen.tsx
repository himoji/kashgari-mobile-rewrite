import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { ChildCard } from '@/features/children/child-parts';
import { useChildren } from '@/features/children/use-children';
import { Button } from '@/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/ui/feedback';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

/** Parent home: greeting, the linked children (each opens their dashboard) and "add a child". */
export function ParentHomeScreen() {
  const { t } = useTranslation();
  const { name } = useProfile();
  const { children, loading, error, refreshing, refetch } = useChildren();
  const addChild = () => router.push('/parent/add-child');

  return (
    <TabScreen mascot="home" title={t('parent.hello', { name: name.split(' ')[0] ?? name })} refreshing={refreshing} onRefresh={refetch}>
      {loading ? (
        <View className="gap-3">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <View>
          <View className="mx-0.5 mb-[14px] mt-1">
            <Text className="mb-[5px] font-body-semibold text-[17px] leading-[24px]">{t('parent.myChildren')}</Text>
            <Text className="font-body text-[12px] leading-[19px] text-subtle">{t('parent.myChildrenHint')}</Text>
          </View>
          <View className="gap-3">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} onPress={() => router.push({ pathname: '/parent/child/[id]', params: { id: child.id } })} />
            ))}
          </View>
          {children.length === 0 ? <EmptyState title={t('parent.noChildren')} body={t('parent.noChildrenBody')} illustration="classroom" /> : null}
          <Button
            variant="soft"
            icon="plus"
            label={t('parent.addChild')}
            onPress={addChild}
            className="mt-4 h-[46px] rounded-[13px] bg-[#f3f7ff]"
          />
        </View>
      )}
    </TabScreen>
  );
}
