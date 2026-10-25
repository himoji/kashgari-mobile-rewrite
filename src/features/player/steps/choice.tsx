import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { Text } from '@/ui/text';

import { asList } from '../engine/checking';
import type { ChoiceQuestion, ChoiceStep, Mode, StepViewProps } from '../engine/types';
import { Chips, OptionRow, Prompt, WordChip, openWord, type OptionState } from '../parts';
import { PassageText } from './passage';

function optionState(option: string, chosen: string | null | undefined, q: ChoiceQuestion, mode: Mode): OptionState {
  if (mode === 'review') {
    if (q.correct !== undefined && option === q.correct) return 'correct';
    return option === chosen ? 'wrong' : 'idle';
  }
  return option === chosen ? 'selected' : 'idle';
}

/** Multiple choice, true/false and grammar story questions: question cards with A/B/C rows. */
export function ChoiceView({ step, answer, onAnswer, mode }: StepViewProps<ChoiceStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const chosen = asList(answer);
  const tf = step.label === 'tf';
  const grammar = step.label === 'grammar';
  const choose = (i: number, option: string) => {
    const next = step.questions.map((_, j) => chosen[j] ?? null);
    next[i] = option;
    onAnswer(next);
  };
  const labelOf = (option: string) => (tf ? t(`player.${option === 'true' ? 'true' : 'false'}`) : content(option));

  return (
    <View>
      {step.intro?.length ? <PassageText paragraphs={step.intro} /> : null}
      {step.examples?.length ? (
        <Chips className={step.intro?.length ? 'mb-6 mt-3' : 'mb-6'}>
          {step.examples.map((w, i) => (
            <WordChip key={`${w}-${i}`} word={w} />
          ))}
        </Chips>
      ) : null}
      {grammar && step.prompt ? <Prompt className={step.examples?.length ? 'mt-0' : undefined}>{content(step.prompt)}</Prompt> : null}
      {step.questions.map((q, i) => (
        <View key={`${q.question}-${i}`} className={i > 0 ? 'mt-3' : undefined}>
          {grammar && step.prompt ? (
            <Text className="mb-[10px] mt-2 font-body text-[15px] leading-[23px] text-ink">{content(q.question)}</Text>
          ) : (
            <Prompt className={i === 0 && (step.examples?.length || !step.intro?.length) ? 'mt-0' : undefined}>{content(q.question)}</Prompt>
          )}
          <View className={tf ? 'flex-row gap-[9px]' : 'gap-[9px]'}>
            {q.options.map((option, j) => (
              <OptionRow
                key={`${option}-${j}`}
                letter={tf ? undefined : String.fromCharCode(65 + j)}
                label={labelOf(option)}
                state={optionState(option, chosen[i], q, mode)}
                onPress={mode === 'play' ? () => choose(i, option) : undefined}
                className={tf ? 'flex-1' : undefined}
              />
            ))}
          </View>
          {mode === 'review' && chosen[i] == null ? (
            <Text className="mt-2 font-body text-[13px] text-subtle">{t('player.notAnswered')}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Words of the topic as tappable chips (writing tasks, outline). */
export function WordList({ words, className }: { words: string[]; className?: string }) {
  return (
    <Chips className={className}>
      {words.map((w) => (
        <WordChip key={w} word={w} onPress={() => openWord(w)} />
      ))}
    </Chips>
  );
}
