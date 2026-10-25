import { useMutation } from '@apollo/client/react';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { ADD_CHILD } from '@/features/children/gql';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Sheet } from '@/ui/sheet';

/** "Бала қосу" sheet: the child's student ID links their account to this parent. */
export function AddChildScreen() {
  const { t } = useTranslation();
  const { profileId } = useProfile();
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string>();
  const [addChild, { loading }] = useMutation(ADD_CHILD, { refetchQueries: ['ChildrenQuery'], awaitRefetchQueries: true });

  const submit = async () => {
    const id = studentId.trim();
    if (!id) return setError(t('parent.add.empty'));
    setError(undefined);
    try {
      const { data } = await addChild({ variables: { parentId: profileId, studentId: id } });
      if (!data?.addChild) return setError(t('parent.add.failed'));
      router.back();
    } catch {
      setError(t('parent.add.failed'));
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Sheet title={t('parent.addChild')} description={t('parent.add.hint')} onClose={() => router.back()}>
        <View className="gap-4">
          <Input
            label={t('parent.add.label')}
            placeholder={t('parent.add.placeholder')}
            value={studentId}
            onChangeText={(v) => (setStudentId(v), setError(undefined))}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            error={error}
            autoFocus
          />
          <Button size="lg" label={t('parent.add.submit')} loading={loading} onPress={() => void submit()} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
