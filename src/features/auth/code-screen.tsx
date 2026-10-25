import { useMutation } from '@apollo/client/react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { REQUEST_CODE, VERIFY_CODE } from '@/features/auth/gql';
import { LoginLayout } from '@/features/auth/login-layout';
import { phoneDigits } from '@/features/auth/phone';
import { finishSignIn } from '@/features/auth/sign-in';
import { goBack } from '@/lib/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

const RESEND_SECONDS = 58; // server cooldown

export function CodeScreen() {
  const { t } = useTranslation();
  const { phone = '', requestId = '' } = useLocalSearchParams<{ phone: string; requestId: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [verify] = useMutation(VERIFY_CODE, { fetchPolicy: 'no-cache' });
  const [requestCode] = useMutation(REQUEST_CODE);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await verify({ variables: { requestId, verificationCode: value } });
      const rows = data?.verifyPhoneNumberAllLanguages;
      if (!rows?.length) {
        setError(t('auth.codeWrong'));
        return;
      }
      await finishSignIn(rows.map((r) => ({ language: r.language, ...r.authInfo })));
    } catch {
      setError(t('auth.codeWrong'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    setError('');
    const { data } = await requestCode({ variables: { requestId, phoneNumber: phoneDigits(phone) } }).catch(() => ({ data: null }));
    if (!data?.requestVerification) setError(t('auth.sendFailed'));
  };

  return (
    <LoginLayout
      logo={false}
      footer={
        <>
          <Pressable disabled={wait > 0} onPress={resend} className="min-h-11 items-center justify-center">
            <Text className={cn('font-body text-[13px]', wait > 0 ? 'text-[#8a95a7]' : 'text-link')}>
              {wait > 0 ? t('auth.resendIn', { n: wait }) : t('auth.resend')}
            </Text>
          </Pressable>
          <Button size="lg" variant="strong" label={t('auth.signIn')} loading={busy} onPress={() => submit()} />
        </>
      }
    >
      <Pressable onPress={() => goBack()} className="mb-6 min-h-11 justify-center self-start">
        <Text className="font-body text-[14px] text-link">{t('auth.changePhone')}</Text>
      </Pressable>
      <Text variant="display" className="mb-3 text-[28px] leading-[34px]" nativeID="code-label">
        {t('auth.enterCode')}
      </Text>
      <Text variant="body" tone="muted" className="mb-5">
        {t('auth.codeSentTo', { phone })}
      </Text>
      <TextInput
        accessibilityLabelledBy="code-label"
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, '').slice(0, 6);
          setCode(digits);
          if (digits.length === 6) void submit(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        aria-invalid={!!error}
        className={cn('h-[52px] rounded-control bg-surface px-3.5 font-body text-[20px] tracking-[6px] text-ink', error && 'border border-late')}
      />
      <Text accessibilityRole="alert" className="mb-3.5 mt-2 min-h-[18px] font-body text-[12px] text-late">
        {error}
      </Text>
    </LoginLayout>
  );
}
