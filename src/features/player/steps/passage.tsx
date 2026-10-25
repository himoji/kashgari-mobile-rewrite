import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Icon } from '@/ui/icon';
import { gradient } from '@/ui/gradient';
import { ProgressBar } from '@/ui/progress-bar';
import { Text } from '@/ui/text';

import type { PassageParagraph, PassageStep, StepViewProps } from '../engine/types';
import { openWord, StepHeading } from '../parts';

const SIZES = [14, 16, 18, 20, 22];

/** Passage text; every marked word opens the dictionary sheet, topic words are underlined. */
export function PassageText({ paragraphs, baseWords, fontSize = 16 }: { paragraphs: PassageParagraph[]; baseWords?: string[]; fontSize?: number }) {
  const content = useContentText();
  const base = useMemo(() => new Set((baseWords ?? []).map((w) => w.toLocaleLowerCase('kk'))), [baseWords]);
  const lineHeight = fontSize * 1.6;
  return (
    <View>
      {paragraphs.map((p, i) => (
        <View key={i}>
          {p.image ? <Image source={{ uri: p.image }} style={{ width: '100%', aspectRatio: 1.6, borderRadius: 14, marginBottom: 12 }} contentFit="cover" /> : null}
          <Text className="mb-3 font-reading text-ink" style={{ fontSize, lineHeight }}>
            {p.tokens.map((tok, j) =>
              tok.kind === 'text' ? (
                content(tok.text)
              ) : (
                <Text
                  key={j}
                  accessibilityRole="button"
                  onPress={() => openWord(tok.lemma)}
                  className="font-reading text-ink"
                  style={
                    base.has(tok.lemma) || base.has(tok.text.toLocaleLowerCase('kk'))
                      ? { fontSize, lineHeight, textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#8b8d99' }
                      : { fontSize, lineHeight }
                  }
                >
                  {content(tok.text)}
                </Text>
              ),
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FontButton({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-control bg-surface active:bg-canvas disabled:opacity-40"
      style={{ boxShadow: 'inset 0 0 0 1px #d3d5de' }}
    >
      <Text className="font-body-semibold text-[15px] leading-[22.5px] text-black">{label}</Text>
    </Pressable>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function AudioCard({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation();
  const content = useContentText();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const progress = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;
  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || (status.duration && status.currentTime >= status.duration)) void player.seekTo(0);
      player.play();
    }
  };
  return (
    <View className="my-3 gap-3 rounded-[16px] bg-[#f6f6fa] p-3">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? t('player.pauseAudio') : t('player.playAudio')}
          onPress={toggle}
          className="h-11 w-11 items-center justify-center rounded-control bg-primary-strong active:opacity-90"
          style={gradient('sheen')}
        >
          {status.playing && status.isBuffering ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name={status.playing ? 'pause' : 'play'} size={18} color={colors.white} />
          )}
        </Pressable>
        <View className="flex-1">
          <Text variant="strong" numberOfLines={1}>{content(title)}</Text>
          {status.error ? (
            <Text variant="caption" className="text-late">{t('common.states.audioError')}</Text>
          ) : (
            <Text variant="caption">{t('player.labels.listening')}</Text>
          )}
        </View>
        <Text className="font-body-medium text-[12px] text-hint">
          {clock(status.currentTime)}
          {status.duration ? ` / ${clock(status.duration)}` : ''}
        </Text>
      </View>
      <ProgressBar value={progress} className="h-[5px] rounded-lg bg-[#e3e8f2]" fillClassName="rounded-lg bg-primary" />
    </View>
  );
}

/** Reading text, or the audio player with a folded transcript for listening. */
export function PassageView({ step }: StepViewProps<PassageStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const [size, setSize] = useState(1);
  const [transcript, setTranscript] = useState(false);
  const words = step.paragraphs.reduce((n, p) => n + p.tokens.reduce((m, tok) => m + tok.text.split(/\s+/).filter(Boolean).length, 0), 0);

  if (step.label === 'listening') {
    return (
      <View>
        {step.title ? <StepHeading className="mb-1">{content(step.title)}</StepHeading> : null}
        {step.audioUrl ? (
          <AudioCard url={step.audioUrl} title={step.title ?? ''} />
        ) : (
          <View className="my-3 flex-row items-center gap-3 rounded-[16px] bg-[#f6f6fa] p-3">
            <Icon name="audio" size={20} color={colors.link} />
            <Text variant="meta" className="flex-1">{t('player.classAudio')}</Text>
          </View>
        )}
        {step.paragraphs.length ? (
          <View className="rounded-control bg-[#f7f9fc]">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: transcript }}
              onPress={() => setTranscript((v) => !v)}
              className="press h-11 flex-row items-center justify-between px-3"
            >
              <Text className="font-body-medium text-[12px] leading-[18px] text-muted">{t('player.transcript')}</Text>
              <Icon name={transcript ? 'up' : 'down'} size={16} color={colors.muted} />
            </Pressable>
            {transcript ? (
              <View className="px-4 pb-2">
                <PassageText paragraphs={step.paragraphs} baseWords={step.baseWords} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">{step.title ? <StepHeading className="mb-1">{content(step.title)}</StepHeading> : null}</View>
        <View className="flex-row gap-1.5">
          <FontButton label="A−" a11y={t('player.readingSmaller')} disabled={size === 0} onPress={() => setSize((s) => Math.max(0, s - 1))} />
          <FontButton label="A+" a11y={t('player.readingLarger')} disabled={size === SIZES.length - 1} onPress={() => setSize((s) => Math.min(SIZES.length - 1, s + 1))} />
        </View>
      </View>
      <Text className="font-body text-[13px] leading-[18.85px] text-body">{t('player.wordsCount', { count: words })}</Text>
      <View className="mt-6">
        <PassageText paragraphs={step.paragraphs} baseWords={step.baseWords} fontSize={SIZES[size]} />
      </View>
    </View>
  );
}
