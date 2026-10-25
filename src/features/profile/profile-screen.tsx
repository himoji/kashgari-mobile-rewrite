import { router } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UPDATE_LANGUAGE } from '@/features/auth/gql';
import { apiLanguage } from '@/features/auth/profiles';
import { useProfile, useSession, type Script, type UiLanguage } from '@/features/auth/session';
import { UI_LANGUAGES } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Avatar } from '@/ui/avatar';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Facts } from '@/ui/facts';
import { Icon } from '@/ui/icon';
import { SegmentedTabs } from '@/ui/segmented-tabs';
import { TabScreen } from '@/ui/tab-screen';
import { Text } from '@/ui/text';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-[18px]">
      <Text className="mb-2 font-body-medium text-[12px] leading-[17px] text-body">{label}</Text>
      {children}
    </View>
  );
}

/** The Profile tab for every role: who you are, language and script, switch account, sign out. */
export function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfile();
  const session = useSession();
  const [prefs, setPrefs] = useState({ uiLanguage: session.uiLanguage, definitionLanguage: session.definitionLanguage, script: session.script });
  const [saved, setSaved] = useState(false);
  const dirty =
    prefs.uiLanguage !== session.uiLanguage || prefs.definitionLanguage !== session.definitionLanguage || prefs.script !== session.script;

  const [updateLanguage, languageState] = useMutation(UPDATE_LANGUAGE);
  const [failed, setFailed] = useState(false);

  // Script and explanation language stay on the device; the interface language is also saved to the account.
  const save = async () => {
    setFailed(false);
    if (prefs.uiLanguage !== session.uiLanguage) {
      try {
        const { data } = await updateLanguage({ variables: { id: profile.accountId, language: apiLanguage(prefs.uiLanguage) } });
        if (!data?.updateLanguage) throw new Error('not saved');
      } catch {
        return setFailed(true);
      }
    }
    session.setPreferences(prefs);
    setSaved(true);
  };

  // The design keeps the mascot and the orange save button for learners; staff screens are plain and blue.
  const learner = profile.role === 'student' || profile.role === 'parent';

  return (
    <TabScreen title={t('profile.title')} mascot={learner ? 'settings' : undefined}>
      <Card variant="panel">
        <View className="flex-row items-center gap-3">
          <Avatar name={profile.name} />
          <View className="flex-1">
            <Text variant="heading" className="mb-[3px]" numberOfLines={1}>{profile.name}</Text>
            <Text className="font-body text-[12px] leading-[18.6px] text-subtle">{t(`common.roles.${profile.role}`)}</Text>
          </View>
        </View>
        <Facts
          items={[
            { label: t('profile.school'), value: profile.school },
            { label: t('profile.class'), value: profile.className },
            { label: t(profile.login?.includes('@') ? 'profile.email' : 'profile.phone'), value: profile.login },
          ]}
        />
      </Card>

      <Card variant="panel">
        <Text variant="title" className="mb-3">{t('profile.languageAndText')}</Text>
        <Field label={t('profile.interfaceLanguage')}>
          <SegmentedTabs
            variant="choice"
            value={prefs.uiLanguage}
            options={UI_LANGUAGES}
            onChange={(uiLanguage: UiLanguage) => (setPrefs((p) => ({ ...p, uiLanguage })), setSaved(false))}
          />
        </Field>
        <Field label={t('profile.explanationLanguage')}>
          <SegmentedTabs
            variant="choice"
            value={prefs.definitionLanguage}
            options={UI_LANGUAGES}
            onChange={(definitionLanguage: UiLanguage) => (setPrefs((p) => ({ ...p, definitionLanguage })), setSaved(false))}
          />
        </Field>
        <Field label={t('profile.script')}>
          <SegmentedTabs
            variant="choice"
            value={prefs.script}
            options={[
              { value: 'cyrl', label: t('profile.cyrillic') },
              { value: 'latn', label: t('profile.latin') },
            ]}
            onChange={(script: Script) => (setPrefs((p) => ({ ...p, script })), setSaved(false))}
          />
        </Field>
        <Button
          variant={learner ? 'attention' : 'strong'}
          className="mt-1"
          icon={saved && !dirty ? 'check' : undefined}
          label={saved && !dirty ? t('profile.saved') : t('profile.saveChanges')}
          disabled={(!dirty && !saved) || languageState.loading}
          onPress={() => void save()}
        />
        {failed ? <Text className="mt-2 font-body text-[13px] leading-[18px] text-danger">{t('profile.saveFailed')}</Text> : null}
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/accounts')}
        className="mt-1.5 flex-row items-center gap-3 rounded-[15px] bg-surface px-[14px] py-[15px] active:opacity-80"
        style={{ boxShadow: '0 3px 12px rgba(36,38,49,0.047)' }}
      >
        <Icon name="solid-people" size={19} color={colors.subtle} />
        <Text className="flex-1 font-body text-[14px] leading-[21px]">{t('profile.switchAccount')}</Text>
        <Icon name="arrow" size={19} color={colors.ink} />
      </Pressable>

      <Button variant="danger" label={t('profile.signOut')} onPress={session.signOut} />
    </TabScreen>
  );
}
