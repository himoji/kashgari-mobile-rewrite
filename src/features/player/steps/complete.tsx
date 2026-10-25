import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

import { asList, sameText } from '../engine/checking';
import type { CompleteStep, StepViewProps } from '../engine/types';
import { CorrectLine, StepHeading } from '../parts';

/** Sentences with a gap; the student picks the missing word from its group. */
export function CompleteView({ step, answer, onAnswer, mode }: StepViewProps<CompleteStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const chosen = asList(answer);
  const choose = (i: number, word: string) => {
    const next = step.sentences.map((_, j) => chosen[j] ?? null);
    next[i] = next[i] === word ? null : word;
    onAnswer(next);
  };

  return (
    <View>
      <StepHeading>{t('player.labels.complete')}</StepHeading>
      {step.sentences.map((s, i) => {
        const value = chosen[i];
        const right = mode === 'review' && s.correct !== undefined && sameText(value, s.correct);
        return (
          <View key={`${s.before}-${i}`} className={cn('pb-4', i > 0 && 'border-t border-line pt-4')}>
            <Text className="mb-3 font-body-semibold text-[16px] leading-[25px] text-ink">
              {content(s.before)}{' '}
              <Text
                className={cn(
                  'font-body-semibold text-[16px]',
                  !value ? 'text-subtle' : mode === 'review' ? (right ? 'text-[#2f6b3f]' : 'text-late') : 'text-link',
                )}
                style={{ textDecorationLine: 'underline' }}
              >
                {value ? content(value) : '______'}
              </Text>{' '}
              {content(s.after)}
            </Text>
            {mode === 'play' ? (
              <View className="flex-row flex-wrap gap-1.5">
                {s.options.map((o) => {
                  const on = value === o;
                  return (
                    <Pressable
                      key={o}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      onPress={() => choose(i, o)}
                      className={cn('min-h-[44px] justify-center rounded-tile px-3 py-2 active:opacity-80', on ? 'bg-[#eef5ff]' : 'bg-[#f3f5f2]')}
                      style={on ? { boxShadow: 'inset 0 0 0 1px #3b86ff' } : undefined}
                    >
                      <Text className={cn('font-body text-[14px] leading-[20px]', on ? 'text-[#1558ac]' : 'text-ink')}>{content(o)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : !right && s.correct ? (
              <CorrectLine label={t('player.correctAnswer')} value={s.correct} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
