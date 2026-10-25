import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { Button } from '@/ui/button';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

import { asMap } from '../engine/checking';
import { cellKey, encodePlacement, foundCells, gridLetters, gridReviewCells, matchSelection, type Cell } from '../engine/grid';
import type { GridStep, StepViewProps } from '../engine/types';
import { Chips, Instruction, StepHeading } from '../parts';

type Tone = 'idle' | 'selected' | 'found' | 'missed';

const cellBox: Record<Tone, string> = {
  idle: 'bg-[#fafbfe]',
  selected: 'bg-[#ffdc2e]',
  found: 'bg-[#edf8ef]',
  missed: 'bg-danger-soft',
};
const cellText: Record<Tone, string> = { idle: 'text-black', selected: 'text-black', found: 'text-[#2f6b3f]', missed: 'text-late' };

function WordTag({ word, tone }: { word: string; tone: 'idle' | 'found' | 'missed' }) {
  const content = useContentText();
  return (
    <View className={cn('min-h-[36px] flex-row items-center gap-1 rounded-tile px-[11px] py-2', tone === 'idle' ? 'bg-[#f3f5f2]' : cellBox[tone])}>
      {tone === 'found' ? <Icon name="check" size={14} color="#2f6b3f" /> : null}
      <Text className={cn('font-body text-[14px] leading-[20px]', tone === 'idle' ? 'text-ink' : cellText[tone])}>{content(word)}</Text>
    </View>
  );
}

/** Word search: tap the letters of a hidden word, then check the selection. */
export function GridView({ step, answer, onAnswer, mode }: StepViewProps<GridStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const found = asMap(answer);
  const [selected, setSelected] = useState<Cell[]>([]);
  const [miss, setMiss] = useState(false);
  const letters = gridLetters(step.rows);
  const cols = Math.max(...letters.map((r) => r.length));
  const review = mode === 'review' ? gridReviewCells(step.rows, step.words, found) : null;
  const covered = foundCells(found);
  const isSelected = (c: Cell) => selected.some((s) => s.row === c.row && s.col === c.col);

  const toggle = (c: Cell) => {
    setMiss(false);
    setSelected((s) => (isSelected(c) ? s.filter((x) => x.row !== c.row || x.col !== c.col) : [...s, c]));
  };
  const check = () => {
    const match = matchSelection(step.rows, step.words, selected);
    if (!match || found[match.word]) {
      setMiss(true);
      return;
    }
    onAnswer({ ...found, [match.word]: encodePlacement(match.placement) });
    setSelected([]);
  };

  const toneOf = (c: Cell): Tone => {
    if (review) return review.get(cellKey(c)) ?? 'idle';
    if (isSelected(c)) return 'selected';
    return covered.has(cellKey(c)) ? 'found' : 'idle';
  };

  return (
    <View>
      <StepHeading>{t('player.labels.grid')}</StepHeading>
      <Instruction>{mode === 'review' ? t('player.gridFound', { n: Object.keys(found).length, total: step.words.length }) : t('player.gridHint')}</Instruction>
      <View className="mb-4 mt-1 gap-1">
        {letters.map((row, r) => (
          <View key={r} className="flex-row gap-1">
            {Array.from({ length: cols }, (_, c) => {
              const tone = toneOf({ row: r, col: c });
              const letter = content(row[c] ?? '');
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={letter}
                  accessibilityState={{ selected: tone === 'selected', disabled: mode === 'review' }}
                  disabled={mode === 'review' || !row[c]}
                  onPress={() => toggle({ row: r, col: c })}
                  className={cn('aspect-square flex-1 items-center justify-center rounded-[8px] border border-transparent active:opacity-80', cellBox[tone])}
                >
                  <Text className={cn('font-body text-[17px] leading-[22px]', cellText[tone])}>{letter}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <Chips>
        {step.words.map((w) => (
          <WordTag key={w} word={w} tone={found[w] ? 'found' : mode === 'review' ? 'missed' : 'idle'} />
        ))}
      </Chips>
      {mode === 'play' ? (
        <View className="mt-[7px] flex-row items-center gap-3">
          <Button variant="soft" label={t('player.check')} onPress={check} className="self-start" />
          {miss ? <Text className="flex-1 font-body text-[13px] leading-[20px] text-[#6d84a5]">{t('player.tryAgain')}</Text> : null}
          {selected.length && !miss ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('player.clear')} onPress={() => setSelected([])} hitSlop={8} className="ml-auto h-9 w-9 items-center justify-center rounded-full active:bg-line">
              <Icon name="close" size={18} color={colors.subtle} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
