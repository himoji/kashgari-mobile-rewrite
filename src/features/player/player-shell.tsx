import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { haptics } from '@/lib/haptics';
import { motion, pageIn, toastIn, toastOut } from '@/lib/motion';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { useModalMotion } from '@/ui/dialog';
import { Icon, type IconName } from '@/ui/icon';
import { ProgressBar } from '@/ui/progress-bar';
import { Text } from '@/ui/text';

import { isStepComplete } from './engine/checking';
import type { Answers, Mode, Step, StepAnswer, StepLabel } from './engine/types';
import { FocusHeader } from './parts';
import { WordList } from './steps/choice';
import { StepView } from './steps';

/** Seconds spent per activity group, split into text (passage) and games, for submission stats. */
export type Timing = Record<string, { text: number; games: number }>;

type Props = {
  title: string;
  steps: Step[];
  mode: Mode;
  initialAnswers?: Answers;
  /** Topic words shown in the outline (tap → dictionary). */
  words?: string[];
  backLabel: string;
  onBack?: () => void;
  /** Play mode: called after the student confirms the submit sheet. */
  onSubmit?: (answers: Answers, timing: Timing) => Promise<void>;
  /** Review mode: the last step's button. */
  onFinish?: () => void;
  finishLabel?: string;
};

const stepIcon: Record<StepLabel, IconName> = {
  reading: 'book',
  listening: 'audio',
  cards: 'copy',
  mcq: 'tasks',
  tf: 'tasks',
  complete: 'pen',
  shuffle: 'game',
  match: 'game',
  frq: 'message',
  writing: 'pen',
  story: 'pen',
  imageStory: 'pen',
  grammar: 'lesson',
  grid: 'game',
  crossword: 'game',
  oyna: 'game',
};

function ActionButton({ label, icon, iconAfter, onPress, loading }: { label: string; icon: IconName; iconAfter?: boolean; onPress: () => void; loading?: boolean }) {
  const glyph = loading ? <ActivityIndicator color={colors.white} /> : <Icon name={icon} size={18} color={colors.white} />;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      className="press h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-control bg-attention px-[13px] active:opacity-90"
    >
      {iconAfter ? null : glyph}
      <Text className="font-body-semibold text-[14px] leading-[18px] text-white">{label}</Text>
      {iconAfter ? glyph : null}
    </Pressable>
  );
}

function Toast({ message }: { message: string | null }) {
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Animated.View
      key={message}
      entering={toastIn}
      exiting={toastOut}
      pointerEvents="none"
      style={{ position: 'absolute', left: 40, right: 40, top: Math.max(insets.top, 28) + 42 }}
    >
      <View
        accessibilityLiveRegion="polite"
        className="rounded-[13px] bg-surface px-[15px] py-3"
        style={{ boxShadow: '0 5px 24px rgba(48,62,88,0.11)' }}
      >
        <Text className="font-body text-[13px] leading-[20px] text-[#6d84a5]">{message}</Text>
      </View>
    </Animated.View>
  );
}

/** The design's dialog sheet: title row with a close tile, body, two buttons. */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  busy,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { mounted, backdrop, panel } = useModalMotion(visible, 32, motion.sheet);
  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <Pressable accessibilityLabel={t('common.actions.close')} className="flex-1 bg-[rgba(36,38,49,0.2)]" onPress={onClose} />
        </Animated.View>
        <Animated.View style={panel}>
          <View className="rounded-t-[22px] bg-surface pt-3" style={{ paddingBottom: insets.bottom + 4, boxShadow: '0 12px 40px rgba(58,38,12,0.15)' }}>
            <View className="mb-[9px] h-1 w-10 self-center rounded bg-[#dce1eb]" />
            <View className="mb-3 flex-row items-center justify-between gap-3 py-[10px] pl-5 pr-3">
              <Text className="flex-1 font-body-medium text-[20px] leading-[26px] text-ink">{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.actions.close')}
                onPress={onClose}
                className="press h-8 w-8 items-center justify-center rounded-tile bg-[#f3f6fb] active:opacity-70"
              >
                <Icon name="close" size={16} color={colors.muted} />
              </Pressable>
            </View>
            <Text className="mb-[14px] px-5 font-body text-[15px] leading-[23.25px] text-meta">{body}</Text>
            <View className="mt-4 flex-row gap-2 px-5 pb-4 pt-3">
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                className="press h-11 flex-1 items-center justify-center rounded-control bg-surface px-4 active:bg-canvas"
                style={{ boxShadow: 'inset 0 0 0 1px #d3d5de' }}
              >
                <Text className="font-body-semibold text-[13px] leading-[16.25px] text-ink">{cancelLabel}</Text>
              </Pressable>
              <Button className="h-11 flex-1" label={confirmLabel} loading={busy} onPress={onConfirm} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Outline({
  steps,
  index,
  done,
  words,
  onJump,
}: {
  steps: Step[];
  index: number;
  done: Set<string>;
  words: string[];
  onJump: (i: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const many = steps.length > 1;
  if (!many && !words.length) return null;
  return (
    <View className="mt-5 rounded-control bg-[#f7f9fc]">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="press h-11 flex-row items-center justify-between gap-3 px-3"
      >
        <Text className="font-body-medium text-[12px] leading-[18px] text-muted">
          {many ? `${t('player.activityOrder')} · ${done.size}/${steps.length}` : t('player.words')}
        </Text>
        <Icon name={open ? 'up' : 'down'} size={16} color={colors.ink} />
      </Pressable>
      {open && many ? (
        <View className="px-2 pb-2">
          {steps.map((s, i) => {
            const current = i === index;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                onPress={() => onJump(i)}
                className={cn('press min-h-12 flex-row items-center gap-3 rounded-control px-[10px] py-1.5', current ? 'bg-warning-soft' : 'bg-transparent')}
              >
                <Icon name={done.has(s.id) ? 'check' : stepIcon[s.label]} size={18} color={done.has(s.id) ? '#2f6b3f' : colors.ink} />
                <Text className={cn('flex-1 text-[15px] leading-[22.5px] text-ink', current ? 'font-body-semibold' : 'font-body')}>
                  {i + 1}. {t(`player.labels.${s.display ?? s.label}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {open && words.length ? (
        <View className="px-4 pb-4 pt-3">
          <WordList words={words} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The player engine: a stepper over a list of steps, one renderer per exercise type.
 * Play mode collects answers and submits them; review mode shows a submitted attempt.
 */
export function PlayerShell({ title, steps, mode, initialAnswers, words = [], backLabel, onBack, onSubmit, onFinish, finishLabel }: Props) {
  const { t } = useTranslation();
  const content = useContentText();
  const insets = useSafeAreaInsets();
  const scroll = useRef<KeyboardAwareScrollViewRef>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [done, setDone] = useState<Set<string>>(() => new Set(mode === 'review' ? steps.map((s) => s.id) : []));
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const spent = useRef<Record<string, number>>({});
  const enteredAt = useRef(0);

  useEffect(() => {
    enteredAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const step = steps[Math.min(index, steps.length - 1)];
  if (!step) return null;
  const last = index >= steps.length - 1;
  const many = steps.length > 1;
  const pct = Math.round((done.size / steps.length) * 100);

  const track = () => {
    const now = Date.now();
    spent.current[step.id] = (spent.current[step.id] ?? 0) + (now - enteredAt.current);
    enteredAt.current = now;
  };
  const goTo = (i: number) => {
    track();
    setIndex(i);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const complete = (s: Step) => mode === 'review' || isStepComplete(s, answers[s.id]);

  const next = () => {
    if (!complete(step)) {
      setToast(t('player.finishActivity'));
      return;
    }
    setDone((d) => new Set(d).add(step.id));
    goTo(index + 1);
  };

  const askSubmit = () => {
    const missing = steps.findIndex((s) => !complete(s));
    if (missing >= 0) {
      if (missing !== index) goTo(missing);
      setToast(t('player.finishActivity'));
      return;
    }
    setDone((d) => new Set(d).add(step.id));
    setConfirm(true);
  };

  const submit = async () => {
    if (!onSubmit) return;
    track();
    const timing: Timing = {};
    for (const s of steps) {
      const secs = Math.round((spent.current[s.id] ?? 0) / 1000);
      const g = (timing[s.group] ??= { text: 0, games: 0 });
      if (s.kind === 'passage' || s.kind === 'cards') g.text += secs;
      else g.games += secs;
    }
    setBusy(true);
    try {
      await onSubmit(answers, timing);
      haptics.success();
      setConfirm(false);
    } catch {
      setConfirm(false);
      setToast(t('player.submitError'));
    } finally {
      setBusy(false);
    }
  };

  const setAnswer = (value: StepAnswer) => setAnswers((a) => ({ ...a, [step.id]: value }));
  const shown = step.title && step.title === title ? { ...step, title: undefined } : step;
  let primary: ReactNode;
  if (!last) primary = <ActionButton label={t('player.next')} icon="arrow" iconAfter onPress={next} />;
  else if (mode === 'review') primary = <ActionButton label={finishLabel ?? t('common.actions.close')} icon="check" onPress={onFinish ?? (() => onBack?.())} />;
  else primary = <ActionButton label={t('player.submit')} icon="check" onPress={askSubmit} />;

  return (
    <View className="flex-1 bg-surface">
      <FocusHeader label={backLabel} onBack={onBack} />
      <KeyboardAwareScrollView
        ref={scroll}
        bottomOffset={90}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 + insets.bottom }}
      >
        <View className="mb-5">
          <Text className="mb-1.5 font-body-semibold text-[17px] leading-[23px] text-ink">{content(title)}</Text>
          <Text className={cn('font-body text-[11px] leading-[16px] text-[#7a8090]', many && 'mb-3')}>
            {many ? `${t('player.stepOf', { n: index + 1, total: steps.length })} · ` : ''}
            {t(`player.labels.${step.display ?? step.label}`)}
          </Text>
          {many ? (
            <ProgressBar value={pct / 100} className="h-[5px] rounded-lg bg-[#edf2fa]" fillClassName="rounded-lg bg-primary" />
          ) : null}
        </View>
        <Animated.View key={step.id} entering={pageIn}>
          <StepView step={shown} answer={answers[step.id]} onAnswer={setAnswer} mode={mode} />
        </Animated.View>
        {mode === 'play' && done.has(step.id) ? (
          <View className="mt-4 flex-row items-center gap-2">
            <Icon name="check" size={18} color="#2f6b3f" />
            <Text className="font-body-semibold text-[15px] text-[#2f6b3f]">{t('player.activityCompleted')}</Text>
          </View>
        ) : null}
        <Outline steps={steps} index={index} done={done} words={words} onJump={goTo} />
      </KeyboardAwareScrollView>
      <View
        className="absolute inset-x-0 bottom-0 flex-row items-center gap-[10px] bg-white/95 px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 14, boxShadow: '0 -5px 18px rgba(36,38,49,0.01)' }}
      >
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('player.previous')}
            onPress={() => goTo(index - 1)}
            className="press h-[46px] w-[46px] items-center justify-center rounded-control bg-[#f2f6fd] active:opacity-80"
          >
            <Icon name="back" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
        {primary}
      </View>
      <Toast message={toast} />
      <ConfirmSheet
        visible={confirm}
        title={t('player.confirmTitle')}
        body={t('player.confirmBody')}
        confirmLabel={t('player.submit')}
        cancelLabel={t('player.cancel')}
        onConfirm={() => void submit()}
        onClose={() => !busy && setConfirm(false)}
        busy={busy}
      />
    </View>
  );
}
