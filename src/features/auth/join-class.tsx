import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { gql } from '@/graphql';
import { resolveProfiles } from '@/features/auth/profiles';
import { useSession } from '@/features/auth/session';
import { apolloClient } from '@/lib/apollo';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Text } from '@/ui/text';

const CHECK_CLASS = gql(`
  query CheckClass($classId: ID!) {
    class(id: $classId) { id }
  }
`);

const ADD_STUDENT = gql(`
  mutation AddStudent($accountId: ID!, $studentName: String!, $classId: ID!) {
    addStudent(accountId: $accountId, studentName: $studentName, classId: $classId) { id }
  }
`);

/** A new phone number has accounts but no profiles: students join their class with the teacher's code. */
export function JoinClass() {
  const { t } = useTranslation();
  const credentials = useSession((s) => s.credentials);
  const signOut = useSession((s) => s.signOut);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const join = async () => {
    const classId = code.trim();
    if (!classId || name.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      // The class lives in exactly one language database; find which.
      const found = await Promise.all(
        credentials.map((c) =>
          apolloClient
            .query({ query: CHECK_CLASS, variables: { classId }, context: { credentials: c }, fetchPolicy: 'network-only' })
            .then(({ data }) => (data?.class ? c : null))
            .catch(() => null),
        ),
      );
      const owner = found.find((c) => c !== null);
      if (!owner) return setError(t('auth.classNotFound'));
      await apolloClient.mutate({
        mutation: ADD_STUDENT,
        variables: { accountId: owner.accountId, studentName: name.trim(), classId },
        context: { credentials: owner },
      });
      const profiles = await resolveProfiles(credentials);
      useSession.getState().signIn(credentials, profiles);
    } catch {
      setError(t('auth.joinFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text variant="display" className="text-[28px] leading-[34px]">{t('auth.joinTitle')}</Text>
        <Text variant="body" tone="muted">{t('auth.joinBody')}</Text>
      </View>
      <Input label={t('auth.classCode')} value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} />
      <Input label={t('auth.yourName')} value={name} onChangeText={setName} textContentType="name" error={error || undefined} />
      <Button size="lg" variant="strong" label={t('auth.join')} loading={busy} onPress={join} />
      <Pressable onPress={signOut} className="min-h-11 justify-center">
        <Text className="font-body text-[13px] text-link">{t('auth.otherNumber')}</Text>
      </Pressable>
    </View>
  );
}
