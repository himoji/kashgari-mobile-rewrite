import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JoinClass } from '@/features/auth/join-class';
import { LoginLayout } from '@/features/auth/login-layout';
import { useActiveProfile, useSession, type Profile } from '@/features/auth/session';
import { goBack } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { Avatar } from '@/ui/avatar';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Sheet } from '@/ui/sheet';
import { Text } from '@/ui/text';

/**
 * `showLanguage`: the login owns accounts in several learning languages, so each row names its own.
 * `active`: the profile in use (when switching), highlighted with a check.
 */
function AccountOption({ profile, showLanguage, active, onPress }: { profile: Profile; showLanguage: boolean; active: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn(
        'min-h-[76px] flex-row items-center gap-3 rounded-[14px] border p-3 active:bg-canvas',
        active ? 'border-primary bg-primary-soft' : 'border-[#e7edf5] bg-surface',
      )}
    >
      <Avatar name={profile.name} size={38} square />
      <View className="flex-1">
        <Text variant="strong" numberOfLines={1}>{profile.name}</Text>
        <Text className="mt-[3px] font-body text-[11px] text-muted" numberOfLines={1}>
          {[showLanguage && t(`auth.learning.${profile.language}`), t(`common.roles.${profile.role}`), profile.className, profile.school].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {active ? <Icon name="check" size={20} color={colors.primary} /> : <Text className="font-body text-[24px] text-link">›</Text>}
    </Pressable>
  );
}

/** Account picker: after login when a number owns several profiles, and from Profile → Switch account. */
export function AccountsScreen() {
  const { t } = useTranslation();
  const profiles = useSession((s) => s.profiles);
  const activeKey = useSession((s) => s.activeKey);
  const setActive = useSession((s) => s.setActive);
  const signOut = useSession((s) => s.signOut);
  const switching = !!useActiveProfile();
  const manyLanguages = new Set(profiles.map((p) => p.language)).size > 1;

  const choose = (key: string) => {
    setActive(key);
    router.dismissTo('/');
  };

  const sheet = profiles.length ? (
    <Sheet
      title={switching ? t('auth.switchAccount') : t('auth.whoIsSigningIn')}
      description={t('auth.chooseAccount')}
      onClose={switching ? () => goBack() : undefined}
    >
      <View className="gap-2.5">
        {profiles.map((p) => (
          <AccountOption key={p.key} profile={p} showLanguage={manyLanguages} active={p.key === activeKey} onPress={() => choose(p.key)} />
        ))}
      </View>
      <Pressable onPress={signOut} className="press mt-2 min-h-11 justify-center">
        <Text className="font-body text-[13px] text-link">{t('auth.otherNumber')}</Text>
      </Pressable>
    </Sheet>
  ) : null;

  if (switching) return sheet;
  return (
    <View className="flex-1">
      <LoginLayout>
        {profiles.length ? (
          <Text variant="display" className="text-[28px] leading-[34px]">{t('auth.welcomeBack')}</Text>
        ) : (
          <JoinClass />
        )}
      </LoginLayout>
      {sheet ? <View className="absolute inset-0">{sheet}</View> : null}
    </View>
  );
}
