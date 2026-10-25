import { useMutation } from '@apollo/client/react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { REQUEST_CODE, VERIFY_CODE } from '@/features/auth/gql';
import { LoginLayout } from '@/features/auth/login-layout';
import { codeDigits, phoneDigits } from '@/features/auth/phone';
import { finishSignIn } from '@/features/auth/sign-in';
import { haptics } from '@/lib/haptics';
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
  const field = useRef<TextInput>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [verify] = useMutation(VERIFY_CODE, { fetchPolicy: 'no-cache' });
  const [requestCode] = useMutation(REQUEST_CODE);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  // A wrong code is cleared, so the next one can be typed (or pasted) straight away.
  const wrong = () => {
    haptics.error();
    setError(t('auth.codeWrong'));
    setCode('');
    field.current?.focus();
  };

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await verify({ variables: { requestId, verificationCode: value } });
      const rows = data?.verifyPhoneNumberAllLanguages;
      if (!rows?.length) return wrong();
      await finishSignIn(rows.map((r) => ({ language: r.language, ...r.authInfo })));
    } catch {
      wrong();
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
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: wait > 0 }}
            disabled={wait > 0}
            onPress={resend}
            className="press min-h-11 items-center justify-center active:opacity-70"
          >
            <Text className={cn('font-body text-[13px]', wait > 0 ? 'text-muted' : 'text-link')}>
              {wait > 0 ? t('auth.resendIn', { n: wait }) : t('auth.resend')}
            </Text>
          </Pressable>
          <Button size="lg" variant="strong" label={t('auth.signIn')} loading={busy} disabled={code.length !== 6} onPress={() => submit()} />
        </>
      }
    >
      <Pressable accessibilityRole="button" onPress={() => goBack()} className="press mb-6 min-h-11 justify-center self-start active:opacity-70">
        <Text className="font-body text-[14px] text-link">{t('auth.changePhone')}</Text>
      </Pressable>
      <Text variant="display" className="mb-3 text-[28px] leading-[34px]" nativeID="code-label">
        {t('auth.enterCode')}
      </Text>
      <Text variant="body" tone="muted" className="mb-5">
        {t('auth.codeSentTo', { phone })}
      </Text>
      {/* No maxLength: it would cut a pasted "123 456" before the space is dropped. */}
      <TextInput
        ref={field}
        accessibilityLabelledBy="code-label"
        value={code}
        onChangeText={(v) => {
          const digits = codeDigits(v);
          setCode(digits);
          if (digits.length === 6) void submit(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxFontSizeMultiplier={1.3}
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
