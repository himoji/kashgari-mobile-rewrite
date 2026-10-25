import { useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

import { asMap } from '../engine/checking';
import {
  clueSenses,
  crosswordCellState,
  crosswordLayout,
  entryText,
  isEntryCorrect,
  isEntryFilled,
  key,
  normalizeLetter,
  pickEntry,
  stepCell,
  type CrosswordEntry,
} from '../engine/crossword';
import type { CrosswordStep, StepViewProps } from '../engine/types';
import { CorrectLine, Instruction, StepHeading } from '../parts';

type Tone = 'idle' | 'word' | 'focused' | 'correct' | 'wrong';

const box: Record<Tone, { bg: string; ring: string }> = {
  idle: { bg: 'bg-surface', ring: 'inset 0 0 0 1px #8a8d99' },
  word: { bg: 'bg-[#eef5ff]', ring: 'inset 0 0 0 1px #3b86ff' },
  focused: { bg: 'bg-[#eef5ff]', ring: 'inset 0 0 0 2px #0a74ff' },
  correct: { bg: 'bg-[#edf8ef]', ring: 'inset 0 0 0 1px #2f6b3f' },
  wrong: { bg: 'bg-danger-soft', ring: `inset 0 0 0 1px ${colors.danger}` },
};
const letterColor: Record<Tone, string> = { idle: 'text-black', word: 'text-[#1558ac]', focused: 'text-[#1558ac]', correct: 'text-[#2f6b3f]', wrong: 'text-late' };

const GAP = 5;
const MAX_CELL = 52;

function ClueRow({ entry, active, filled, onPress }: { entry: CrosswordEntry; active: boolean; filled: boolean; onPress?: () => void }) {
  const { t } = useTranslation();
  const content = useContentText();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn('min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] px-[10px] py-[6px]', active ? 'bg-[#eef5ff]' : 'active:bg-canvas')}
    >
      <View className={cn('h-[26px] w-[26px] items-center justify-center rounded-[8px]', active ? 'bg-primary-strong' : 'bg-[#f1f5fb]')}>
        <Text className={cn('font-body-semibold text-[12px] leading-[20px]', active ? 'text-white' : 'text-[#8a95a7]')}>{entry.number}</Text>
      </View>
      <View className="flex-1">
        <Text className={cn('font-body text-[14px] leading-[20px]', active ? 'text-[#1558ac]' : 'text-[#343845]')}>{content(clueSenses(entry.clue).join(' / '))}</Text>
        <Text className="font-body text-[11px] leading-[16px] text-[#7a8090]">
          {t(entry.direction === 'HORIZONTAL' ? 'player.across' : 'player.down')} · {t('player.letters', { count: entry.length })}
        </Text>
      </View>
      {filled ? <Icon name="check" size={16} color={colors.subtle} /> : null}
    </Pressable>
  );
}

/** Crossword: tap a cell or a clue, then type the word; crossing words share letters. */
export function CrosswordView({ step, answer, onAnswer, mode }: StepViewProps<CrosswordStep>) {
  const { t } = useTranslation();
  const content = useContentText();
  const layout = useMemo(() => crosswordLayout(step.words), [step.words]);
  const letters = asMap(answer);
  const [active, setActive] = useState(() => Math.max(0, layout.entries.findIndex((e) => e.number === 1)));
  const [focused, setFocused] = useState<string | null>(null);
  const [width, setWidth] = useState(350);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const entry = layout.entries[active] ?? layout.entries[0];
  if (!entry) return null;

  const size = Math.min(MAX_CELL, Math.floor((width - GAP * (layout.cols - 1)) / Math.max(layout.cols, 1)));
  const review = mode === 'review';

  const focusCell = (cell: string | null | undefined) => {
    if (cell) inputs.current[cell]?.focus();
  };
  const setLetter = (cell: string, letter: string) => {
    const next = { ...letters };
    if (letter) next[cell] = letter;
    else delete next[cell];
    onAnswer(next);
  };
  const type = (cell: string, text: string) => {
    const letter = text ? normalizeLetter(text) : '';
    setLetter(cell, letter);
    if (letter) focusCell(stepCell(entry, cell, 1));
  };
  const erase = (cell: string) => {
    if (letters[cell]) return;
    const prev = stepCell(entry, cell, -1);
    if (!prev) return;
    setLetter(prev, '');
    focusCell(prev);
  };
  const onFocus = (cell: string) => {
    if (focused !== cell) setActive(pickEntry(layout, cell, active, null));
    setFocused(cell);
  };
  const onPressCell = (cell: string) => {
    if (focused === cell) setActive(pickEntry(layout, cell, active, focused));
  };
  const openEntry = (i: number) => {
    const e = layout.entries[i]!;
    setActive(i);
    focusCell(e.cells.find((k) => !letters[k]) ?? e.cells[0]);
  };

  const toneOf = (cell: string): Tone => {
    if (review) {
      const state = crosswordCellState(layout, letters, cell);
      return state === 'empty' ? 'idle' : state;
    }
    if (cell === focused) return 'focused';
    return entry.cells.includes(cell) ? 'word' : 'idle';
  };
  const numberAt = new Map(layout.entries.map((e) => [e.cells[0]!, e.number]));
  const byNumber = layout.entries.map((_, i) => i).sort((a, b) => layout.entries[a]!.number - layout.entries[b]!.number);
  const fontSize = Math.max(14, Math.round(size * 0.42));

  return (
    <View>
      <StepHeading>{t('player.labels.crossword')}</StepHeading>
      {review ? (
        <Instruction>{t('player.crosswordReview')}</Instruction>
      ) : (
        <Instruction>
          {entry.number}. {content(clueSenses(entry.clue).join(' / '))} ({t('player.letters', { count: entry.length })})
        </Instruction>
      )}
      <View className="mt-1 mb-4 items-center" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {Array.from({ length: layout.rows }, (_, r) => (
          <View key={r} className="flex-row" style={{ gap: GAP, marginTop: r ? GAP : 0 }}>
            {Array.from({ length: layout.cols }, (__, c) => {
              const cell = key(layout.top + r, layout.left + c);
              if (!layout.cellEntries.has(cell)) return <View key={c} style={{ width: size, height: size }} />;
              const tone = toneOf(cell);
              const number = numberAt.get(cell);
              return (
                <View
                  key={c}
                  className={cn('items-center justify-center', box[tone].bg)}
                  style={{ width: size, height: size, borderRadius: size >= 40 ? 10 : 7, boxShadow: box[tone].ring }}
                >
                  <TextInput
                    ref={(el) => {
                      inputs.current[cell] = el;
                    }}
                    value={content(letters[cell] ?? '').toLocaleUpperCase('kk')}
                    editable={!review}
                    onChangeText={(text) => type(cell, text)}
                    onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && erase(cell)}
                    onFocus={() => onFocus(cell)}
                    onPressIn={() => onPressCell(cell)}
                    selectTextOnFocus
                    caretHidden
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    contextMenuHidden
                    accessibilityLabel={t('player.cell', { row: r + 1, col: c + 1 })}
                    className={cn('h-full w-full p-0 text-center font-body', letterColor[tone])}
                    style={{ fontSize, outlineStyle: 'none' } as object}
                  />
                  {number ? (
                    <Text pointerEvents="none" className="absolute left-[4px] top-[2px] font-body-semibold text-[9px] leading-[11px] text-[#7a8090]">
                      {number}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View className="gap-1">
        {byNumber.map((i) => layout.entries[i]!).map((e, n) =>
          review ? (
            <View key={e.id} className="border-b border-line py-2">
              <ClueRow entry={e} active={false} filled={false} />
              <Text className={cn('ml-[46px] font-body text-[14px] leading-[20px]', isEntryCorrect(e, letters) ? 'text-[#2f6b3f]' : 'text-late')}>
                {e.cells.some((k) => letters[k]) ? content(entryText(e, letters).replace(/_/g, '·')) : t('player.notAnswered')}
              </Text>
              {!isEntryCorrect(e, letters) && e.word ? (
                <View className="ml-[46px]">
                  <CorrectLine label={t('player.correctAnswer')} value={e.word} />
                </View>
              ) : null}
            </View>
          ) : (
            <ClueRow key={e.id} entry={e} active={byNumber[n] === active} filled={isEntryFilled(e, letters)} onPress={() => openEntry(byNumber[n]!)} />
          ),
        )}
      </View>
    </View>
  );
}
