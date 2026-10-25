import { useMutation } from '@apollo/client/react';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { REQUEST_CODE, REQUEST_ID } from '@/features/auth/gql';
import { LoginLayout } from '@/features/auth/login-layout';
import { formatPhone, isValidPhone, phoneDigits } from '@/features/auth/phone';
import { useSession } from '@/features/auth/session';
import { NoAccountError, signInAsDemo, signInWithApple, signInWithGoogle } from '@/features/auth/sign-in';
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
  const [requestCode] = useMutation(REQUEST_CODE);
  // One sign-in at a time: the code request (two calls) and each provider block the others.
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const busy = sending || social !== null;

  const submit = async () => {
    if (inFlight.current) return;
    if (!isValidPhone(phone)) return setError(t('auth.phoneInvalid'));
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const { data } = await requestId({ variables: { data: { isMobile: true, token: null } } });
      const id = data?.verifyCaptcha;
      const sent = id && (await requestCode({ variables: { requestId: id, phoneNumber: phoneDigits(phone) } })).data?.requestVerification;
      if (!id || !sent) return setError(t('auth.sendFailed'));
      router.push({ pathname: '/code', params: { phone, requestId: id } });
    } catch {
      setError(t('auth.sendFailed'));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  const socialSignIn = async (provider: 'apple' | 'google' | 'demo') => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSocial(provider);
    setError('');
    try {
      await (provider === 'apple' ? signInWithApple() : provider === 'google' ? signInWithGoogle() : signInAsDemo());
    } catch (e) {
      setError(t(e instanceof NoAccountError ? 'auth.noAccount' : 'auth.socialFailed'));
    } finally {
      inFlight.current = false;
      setSocial(null);
    }
  };

  return (
    <LoginLayout
      footer={
        <>
          <Button size="lg" variant="strong" label={t('auth.getCode')} loading={sending} disabled={busy} onPress={submit} />
          <View className="flex-row gap-2 pt-2">
            {Platform.OS === 'ios' ? (
              <Button className="flex-1" variant="ghost" label={t('auth.apple')} loading={social === 'apple'} disabled={busy} onPress={() => socialSignIn('apple')} />
            ) : null}
            <Button className="flex-1" variant="ghost" label={t('auth.google')} loading={social === 'google'} disabled={busy} onPress={() => socialSignIn('google')} />
          </View>
          <Button size="sm" variant="ghost" label={t('auth.demo')} loading={social === 'demo'} disabled={busy} onPress={() => socialSignIn('demo')} />
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
