import { useMutation } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { REQUEST_CODE, REQUEST_ID } from '@/features/auth/gql';
import { LoginLayout } from '@/features/auth/login-layout';
import { formatPhone, isValidPhone, phoneDigits } from '@/features/auth/phone';
import { useSession } from '@/features/auth/session';
import { signInAsDemo, signInWithApple, signInWithGoogle } from '@/features/auth/sign-in';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';

export function PhoneScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const expired = useSession((s) => s.expired);
  const [social, setSocial] = useState<'apple' | 'google' | 'demo' | null>(null);
  const [requestId] = useMutation(REQUEST_ID);
  const [requestCode, { loading }] = useMutation(REQUEST_CODE);

  const submit = async () => {
    if (!isValidPhone(phone)) return setError(t('auth.phoneInvalid'));
    setError('');
    try {
      const { data } = await requestId({ variables: { data: { isMobile: true, token: null } } });
      const id = data?.verifyCaptcha;
      const sent = id && (await requestCode({ variables: { requestId: id, phoneNumber: phoneDigits(phone) } })).data?.requestVerification;
      if (!id || !sent) return setError(t('auth.sendFailed'));
      router.push({ pathname: '/code', params: { phone, requestId: id } });
    } catch {
      setError(t('auth.sendFailed'));
    }
  };

  const socialSignIn = async (provider: 'apple' | 'google' | 'demo') => {
    setSocial(provider);
    setError('');
    try {
      await (provider === 'apple' ? signInWithApple() : provider === 'google' ? signInWithGoogle() : signInAsDemo());
    } catch {
      setError(t('auth.socialFailed'));
    } finally {
      setSocial(null);
    }
  };

  return (
    <LoginLayout
      footer={
        <>
          <Button size="lg" variant="strong" label={t('auth.getCode')} loading={loading} onPress={submit} />
          <View className="flex-row gap-2 pt-2">
            {Platform.OS === 'ios' ? (
              <Button className="flex-1" variant="ghost" label={t('auth.apple')} loading={social === 'apple'} onPress={() => socialSignIn('apple')} />
            ) : null}
            <Button className="flex-1" variant="ghost" label={t('auth.google')} loading={social === 'google'} onPress={() => socialSignIn('google')} />
          </View>
          <Button size="sm" variant="ghost" label={t('auth.demo')} loading={social === 'demo'} onPress={() => socialSignIn('demo')} />
        </>
      }
    >
      <Text variant="display" className="mb-7 text-[28px] leading-[34px]" nativeID="phone-label">
        {t('auth.phone')}
      </Text>
      <TextInput
        accessibilityLabelledBy="phone-label"
        value={phone}
        onChangeText={(v) => setPhone(formatPhone(v))}
        placeholder="+7 700 000 00 00"
        placeholderTextColor={colors.subtle}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        onSubmitEditing={submit}
        className="h-[52px] rounded-control bg-surface px-3.5 font-body text-[16px] text-ink"
      />
      <Text accessibilityRole="alert" className="mb-3.5 mt-2 min-h-[18px] font-body text-[12px] text-late">
        {error || (expired ? t('auth.sessionExpired') : '')}
      </Text>
    </LoginLayout>
  );
}
