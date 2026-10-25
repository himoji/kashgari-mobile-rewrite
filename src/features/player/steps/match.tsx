import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

import { asMap, sameText } from '../engine/checking';
import type { MatchStep, StepViewProps } from '../engine/types';
import { CorrectLine, Instruction, StepHeading } from '../parts';

type Tone = 'idle' | 'selected' | 'paired';

function Tile({ label, tone, badge, onPress }: { label: string; tone: Tone; badge?: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: tone !== 'idle' }}
      onPress={onPress}
      className={cn(
        'min-h-[52px] flex-row items-center gap-2 rounded-[14px] px-3 py-[10px] active:opacity-80',
        tone === 'selected' ? 'bg-warning-soft' : tone === 'paired' ? 'bg-[#eef5ff]' : 'bg-surface',
      )}
      style={{
        boxShadow: tone === 'selected' ? 'inset 0 0 0 2px #242631' : tone === 'paired' ? 'inset 0 0 0 1px #3b86ff' : 'inset 0 0 0 1px #d3d5de',
      }}
    >
      <Text className={cn('flex-1 font-body text-[16px] leading-[20.8px]', tone === 'paired' ? 'text-[#1558ac]' : 'text-black')}>{label}</Text>
      {badge ? (
        <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary-strong px-1">
          <Text className="font-body-semibold text-[11px] leading-[14px] text-white">{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Word ↔ translation grid. The server checks pairs, so pairs are only shown, not judged, while playing. */
export function MatchView({ step, answer, onAnswer, mode }: StepViewProps<MatchStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const pairs = asMap(answer);
  const [selected, setSelected] = useState<string | null>(null);

  if (mode === 'review') {
    return (
      <View>
        <StepHeading>{t('player.labels.match')}</StepHeading>
        {step.pairs.map((p) => {
          const given = pairs[p.word];
          const right = p.correct !== undefined && sameText(given, p.correct);
          return (
            <View key={p.word} className="border-b border-line py-3">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 font-body-semibold text-[15px] leading-[21px] text-ink">{content(p.word)}</Text>
                <Text className={cn('flex-1 text-right font-body text-[15px] leading-[21px]', right ? 'text-[#2f6b3f]' : 'text-late')}>
                  {given ?? t('player.notAnswered')}
                </Text>
              </View>
              {!right && p.correct ? <CorrectLine label={t('player.correctAnswer')} value={p.correct} /> : null}
            </View>
          );
        })}
      </View>
    );
  }

  const order = step.pairs.map((p) => p.word).filter((w) => pairs[w]);
  const badgeOf = (word: string) => order.indexOf(word) + 1 || undefined;
  const wordOf = (translation: string) => Object.keys(pairs).find((w) => pairs[w] === translation);

  const pickWord = (word: string) => {
    if (pairs[word]) {
      const next = { ...pairs };
      delete next[word];
      onAnswer(next);
    }
    setSelected((s) => (s === word ? null : word));
  };
  const pickTranslation = (translation: string) => {
    const owner = wordOf(translation);
    const next = { ...pairs };
    if (owner) delete next[owner];
    if (selected) {
      next[selected] = translation;
      setSelected(null);
    }
    onAnswer(next);
  };

  return (
    <View>
      <StepHeading>{t('player.labels.match')}</StepHeading>
      <Instruction>{t('player.matchHint')}</Instruction>
      <View className="flex-row gap-2">
        <View className="flex-1 gap-[9px]">
          {step.pairs.map((p) => (
            <Tile
              key={p.word}
              label={content(p.word)}
              tone={selected === p.word ? 'selected' : pairs[p.word] ? 'paired' : 'idle'}
              badge={badgeOf(p.word)}
              onPress={() => pickWord(p.word)}
            />
          ))}
        </View>
        <View className="flex-1 gap-[9px]">
          {step.translations.map((tr, i) => {
            const owner = wordOf(tr);
            return (
              <Tile key={`${tr}-${i}`} label={tr} tone={owner ? 'paired' : 'idle'} badge={owner ? badgeOf(owner) : undefined} onPress={() => pickTranslation(tr)} />
            );
          })}
        </View>
      </View>
    </View>
  );
}
