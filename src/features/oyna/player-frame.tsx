import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { formatClock } from '@/features/oyna/logic/game-type';
import type { SessionTimer } from '@/features/oyna/use-session-clock';
import { motion, toastIn, toastOut } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { useModalMotion } from '@/ui/dialog';
import { Icon, type IconName } from '@/ui/icon';
import { ProgressBar } from '@/ui/progress-bar';
import { Text } from '@/ui/text';

export function leavePlayer() {
  if (router.canGoBack()) router.back();
  else router.replace('/student/school');
}

/** The prototype's focused-screen back link: arrow + small label, no tile. */
function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="press h-11 flex-row items-center gap-1.5 rounded-[24px] pl-2 pr-3 active:bg-canvas"
    >
      <Icon name="back" size={20} color={colors.ink} />
      <Text className="font-body-medium text-[12px] leading-[18px] text-body">{label}</Text>
    </Pressable>
  );
}

const secondsLeft = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/** The countdown; it ticks here, so only the pill re-renders each second, and it stops once the game is sent. */
function TimerPill({ endsAt, running }: SessionTimer) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(() => secondsLeft(endsAt));
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds(secondsLeft(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt, running]);
  const low = seconds <= 30;
  return (
    <View
      accessibilityLabel={`${t('oyna.timeLeft')} ${formatClock(seconds)}`}
      className={cn('h-8 flex-row items-center gap-1.5 rounded-full px-3', low ? 'bg-attention-soft' : 'bg-track')}
    >
      <Icon name="clock" size={15} color={low ? colors.attention : colors.link} />
      <Text className={cn('font-body-semibold text-[12px] leading-[16px]', low ? 'text-attention' : 'text-link')}>{formatClock(seconds)}</Text>
    </View>
  );
}

type Props = {
  title: string;
  /** "Қадам 2 / 8 · Аралас әріптер", or just the game type. */
  caption?: string;
  /** 0..1; shown only for multi-step games. */
  progress?: number;
  backLabel?: string;
  onBack?: () => void;
  timer?: SessionTimer | null;
  children: ReactNode;
  /** Collapsible "Сабақ реті / Сөздер" block under the exercise. */
  outline?: ReactNode;
  footer?: ReactNode;
  toast?: ReactNode;
};

/** Layout of every player screen in the prototype (student-player-a4/a6/a8): white page, step head, pinned actions. */
export function PlayerFrame({ title, caption, progress, backLabel, onBack, timer, children, outline, footer, toast }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between gap-3 bg-surface px-5 pb-2.5" style={{ paddingTop: insets.top > 0 ? insets.top : 38 }}>
        <BackLink label={backLabel ?? t('oyna.back')} onPress={onBack ?? leavePlayer} />
        {timer ? <TimerPill endsAt={timer.endsAt} running={timer.running} /> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View className="mb-5">
          <Text className="mb-1.5 font-body-semibold text-[17px] leading-[23px]">{title}</Text>
          {caption ? <Text className="font-body text-[11px] leading-[16px] text-[#7a8090]">{caption}</Text> : null}
          {progress != null ? (
            <ProgressBar value={progress} className="mt-3 h-[5px] rounded-lg bg-[#edf2fa]" fillClassName="rounded-lg bg-primary" />
          ) : null}
        </View>
        {children}
        {outline}
      </ScrollView>
      {footer ? (
        <View
          className="absolute inset-x-0 bottom-0 flex-row items-center gap-2.5 bg-white/95 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 14, boxShadow: '0 -5px 18px rgba(36, 38, 49, 0.01)' }}
        >
          {footer}
        </View>
      ) : null}
      {toast}
    </View>
  );
}

/** Pinned player actions: optional square back button and the orange primary action. */
export function PlayerActions({
  label,
  icon,
  onPress,
  onPrevious,
  disabled,
  loading,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  onPrevious?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      {onPrevious ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('oyna.previous')}
          onPress={onPrevious}
          className="press h-[46px] w-[46px] items-center justify-center rounded-control bg-[#f2f6fd] active:opacity-80"
        >
          <Icon name="back" size={18} color={colors.ink} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        onPress={onPress}
        disabled={disabled || loading}
        className={cn('press h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-control bg-attention px-[13px] active:opacity-90', (disabled || loading) && 'opacity-50')}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : null}
        {!loading && icon && icon !== 'arrow' ? <Icon name={icon} size={18} color={colors.white} /> : null}
        <Text className="font-body-semibold text-[14px] leading-[18px] text-white" numberOfLines={1}>
          {label}
        </Text>
        {!loading && icon === 'arrow' ? <Icon name="arrow" size={18} color={colors.white} /> : null}
      </Pressable>
    </>
  );
}

/** The white hint toast pinned under the app bar ("Қайта тексеріңіз."). */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);
  const node = message ? (
    <Animated.View
      key={message}
      entering={toastIn}
      exiting={toastOut}
      pointerEvents="none"
      style={{ position: 'absolute', left: 40, right: 40, top: (insets.top > 0 ? insets.top : 38) + 32 }}
    >
      <View
        accessibilityLiveRegion="polite"
        className="rounded-[13px] bg-surface px-[15px] py-3"
        style={{ boxShadow: '0 5px 24px rgba(48, 62, 88, 0.11)' }}
      >
        <Text className="font-body text-[13px] leading-[20px] text-[#6d84a5]">{message}</Text>
      </View>
    </Animated.View>
  ) : null;
  return { toast: node, showToast: show };
}

/** "Жұмысты тапсыру керек пе?" dialog (student-player-a4-submit-confirm). */
export function ConfirmSubmit({ visible, loading, onCancel, onConfirm }: { visible: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { mounted, backdrop, panel } = useModalMotion(visible, 32, motion.sheet);
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onCancel}>
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <Pressable accessibilityLabel={t('oyna.cancel')} className="flex-1 bg-[#24263155]" onPress={onCancel} />
        </Animated.View>
        <Animated.View style={panel}>
          <View className="rounded-t-[22px] bg-surface px-5 pt-5" style={{ paddingBottom: insets.bottom + 16, boxShadow: '0 12px 40px rgba(58, 38, 12, 0.15)' }}>
            <View className="mb-5 h-1 w-10 self-center rounded bg-[#dce1eb]" />
            <View className="mb-3 flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-body-medium text-[20px] leading-[26px]">{t('oyna.confirmSubmit')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('oyna.cancel')} onPress={onCancel} className="press h-[34px] w-[34px] items-center justify-center rounded-tile bg-track">
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <Text className="mb-3.5 font-body text-[15px] leading-[23px] text-meta">{t('oyna.confirmSubmitHint')}</Text>
            <View className="mt-4 flex-row gap-2">
              <Button variant="secondary" label={t('oyna.cancel')} onPress={onCancel} className="flex-1" />
              <Button label={t('oyna.submit')} onPress={onConfirm} loading={loading} className="flex-1" />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
