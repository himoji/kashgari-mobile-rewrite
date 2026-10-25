import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

import { asList, wordCount, wordsUsed } from '../engine/checking';
import type { FreeTextStep, StepViewProps } from '../engine/types';
import { AnswerInput, Instruction, Prompt, ResponseBox, StepHeading } from '../parts';
import { WordList } from './choice';

/** Open questions (one box each) and writing tasks (one text with word counters). */
export function FreeTextView({ step, answer, onAnswer, mode }: StepViewProps<FreeTextStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const values = asList(answer);
  const set = (i: number, value: string) => {
    const next = step.prompts.map((_, j) => values[j] ?? null);
    next[i] = value;
    onAnswer(next);
  };

  if (step.label === 'writing') {
    const text = values[0] ?? '';
    const words = step.words ?? [];
    const count = wordCount(text);
    return (
      <View>
        <StepHeading>{t(`player.labels.${step.display ?? 'writing'}`)}</StepHeading>
        <Instruction>{step.instructions ?? t(step.images?.length ? 'player.writingImageHint' : 'player.writingHint')}</Instruction>
        {step.images?.map((uri) => (
          <Image key={uri} source={{ uri }} style={{ width: '100%', height: 220, borderRadius: 14, marginTop: 8 }} contentFit="contain" />
        ))}
        {words.length ? <WordList words={words} className="mb-5 mt-2" /> : null}
        {mode === 'play' ? (
          <AnswerInput
            multiline
            value={text}
            onChangeText={(v) => set(0, v)}
            placeholder={t('player.writeAnswer')}
            accessibilityLabel={t(`player.labels.${step.display ?? 'writing'}`)}
          />
        ) : (
          <ResponseBox text={text} empty={t('player.notAnswered')} />
        )}
        <View className="mt-2 flex-row items-start justify-between gap-[10px]">
          <Text className="font-body text-[14px] leading-[21px] text-body">
            {t('player.wordCount', { n: count })}
            {step.minWords ? ` / ${step.minWords}` : ''}
          </Text>
          {words.length ? (
            <Text className="font-body text-[14px] leading-[21px] text-body">{t('player.wordsUsed', { n: wordsUsed(words, text), total: words.length })}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View>
      {step.prompts.map((p, i) => (
        <View key={`${p.question}-${i}`} className={cn(i > 0 && 'mt-4')}>
          <Prompt className="mt-0">{content(p.question)}</Prompt>
          {mode === 'play' ? (
            <AnswerInput
              multiline
              value={values[i] ?? ''}
              onChangeText={(v) => set(i, v)}
              placeholder={t('player.writeAnswer')}
              accessibilityLabel={p.question}
              className="min-h-[170px]"
            />
          ) : (
            <>
              <ResponseBox text={values[i]} empty={t('player.notAnswered')} />
              <Text className="font-body-medium text-[13px] leading-[19px] text-hint">
                {p.grade != null ? t('player.grade', { n: p.grade }) : t('player.waitingGrade')}
              </Text>
            </>
          )}
        </View>
      ))}
      {mode === 'play' ? <Text className="mt-2 font-body text-[13px] leading-[19px] text-hint">{t('player.waitingGrade')}</Text> : null}
    </View>
  );
}
