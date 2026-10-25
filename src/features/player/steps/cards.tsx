import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useWordTextAudio } from '@/features/dictionary/word-audio';
import { useContentText } from '@/lib/i18n';
import { Text } from '@/ui/text';

import type { CardsStep, StepViewProps } from '../engine/types';
import { SoftIconButton, StepHeading } from '../parts';

/** "Сөздерді үйрену": one blue card at a time; tap flips it to the meaning. */
export function CardsView({ step }: StepViewProps<CardsStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = step.cards[index];
  const speak = useWordTextAudio(card?.word ?? '');
  if (!card) return null;
  const go = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };
  return (
    <View>
      <StepHeading>{t('player.learnWords')}</StepHeading>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: flipped }}
        accessibilityHint={t('player.flipCard')}
        onPress={() => setFlipped((v) => !v)}
        className="h-[180px] items-center justify-center gap-[14px] overflow-hidden rounded-[20px] bg-[linear-gradient(140deg,#4a93ff,#1e75f4)] px-[18px] py-6 active:opacity-95"
        style={{ boxShadow: '0 8px 20px rgba(30,117,244,0.1)' }}
      >
        <View
          pointerEvents="none"
          className="absolute bg-white/[0.13]"
          style={{ top: -100, left: -25, width: 65, height: 400, transform: [{ rotate: '27deg' }], filter: 'blur(20px)' }}
        />
        <Text className="font-body-semibold text-[28px] leading-[36px] tracking-[-0.5px] text-white">{content(card.word)}</Text>
        <Text className="text-center font-body text-[13px] leading-[20px] text-white/85">{flipped ? card.meaning : t('player.flipCard')}</Text>
      </Pressable>
      <View className="mt-[14px] flex-row items-center justify-center gap-[14px]">
        <SoftIconButton icon="back" label={t('player.previous')} disabled={index === 0} onPress={() => go(index - 1)} />
        <Text className="min-w-9 text-center font-body-medium text-[13px] leading-[19.5px] text-[#7a8090]" aria-live="polite">
          {index + 1} / {step.cards.length}
        </Text>
        <SoftIconButton icon="audio" label={t('player.pronunciation')} disabled={!speak} onPress={() => speak?.()} />
        <SoftIconButton icon="arrow" label={t('player.next')} disabled={index === step.cards.length - 1} onPress={() => go(index + 1)} />
      </View>
    </View>
  );
}
