import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';

import { asList, letters, sameText, usedTiles } from '../engine/checking';
import type { ShuffleStep, StepViewProps } from '../engine/types';
import { AnswerInput, Chips, CorrectLine, ResponseBox, StepHeading, WordChip } from '../parts';

/** Scrambled words: tap the letter tiles or type the word. */
export function ShuffleView({ step, answer, onAnswer, mode }: StepViewProps<ShuffleStep>) {
  const { t } = useTranslation();
  const values = asList(answer);
  const set = (i: number, value: string) => {
    const next = step.items.map((_, j) => values[j] ?? null);
    next[i] = value;
    onAnswer(next);
  };

  return (
    <View>
      <StepHeading>{t('player.labels.shuffle')}</StepHeading>
      {step.items.map((item, i) => {
        const value = values[i] ?? '';
        const tiles = letters(item.shuffled);
        const used = usedTiles(tiles, value);
        if (mode === 'review') {
          const right = item.correct !== undefined && sameText(value, item.correct);
          return (
            <View key={`${item.shuffled}-${i}`} className={cn(i > 0 && 'mt-6')}>
              <Chips className="mb-3">
                {tiles.map((c, j) => (
                  <WordChip key={j} word={c} large />
                ))}
              </Chips>
              <ResponseBox text={value} empty={t('player.notAnswered')} />
              {!right && item.correct ? <CorrectLine label={t('player.correctAnswer')} value={item.correct} /> : null}
            </View>
          );
        }
        return (
          <View key={`${item.shuffled}-${i}`} className={cn(i > 0 && 'mt-7')}>
            <Chips>
              {tiles.map((c, j) => (
                <WordChip key={j} word={c} large dim={used[j]} onPress={() => set(i, value + c.toLocaleLowerCase('kk'))} />
              ))}
            </Chips>
            <View className="mt-6 justify-center">
              <AnswerInput
                value={value}
                onChangeText={(v) => set(i, v)}
                autoCapitalize="none"
                accessibilityLabel={t('player.labels.shuffle')}
                className="pr-11"
              />
              {value ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('player.clear')}
                  onPress={() => set(i, '')}
                  hitSlop={8}
                  className="absolute right-3 h-7 w-7 items-center justify-center rounded-full active:bg-line"
                >
                  <Icon name="close" size={18} color={colors.subtle} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
