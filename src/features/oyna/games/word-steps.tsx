import { useMutation } from '@apollo/client/react';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session';
import { useWordTextAudio } from '@/features/dictionary/word-audio';
import { OYNA_WORD_GAME_CAPTCHA_SUBMIT } from '@/features/oyna/gql';
import { sameWord, shuffled } from '@/features/oyna/logic/shuffle';
import { displayTranslation } from '@/features/oyna/logic/translation';
import {
  chunk,
  fillGap,
  gridWordAt,
  lineBetween,
  locateWord,
  mcqAnswer,
  parsePattern,
  pickMatch,
  slotsFilled,
  slotsWord,
  tilesPageDone,
  type Cell,
  type MatchState,
  type McqQuestion,
} from '@/features/oyna/logic/word-game';
import { ChoiceLabel, Chip, ExerciseTitle, Hint, ListChoice, OptionRow } from '@/features/oyna/parts';
import { haptics } from '@/lib/haptics';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { useAnswerMotion } from '@/ui/answer-motion';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';

export type GameWord = { word: string; translation?: string | null; imageUrl?: string | null };
type Toast = (message: string) => void;

function useDefinitionLanguage() {
  return useSession((s) => s.definitionLanguage);
}

/** setTimeout for a step's pauses (show the result, then move on), cleared when the step unmounts. */
function useLater() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  return (run: () => void, ms: number) => {
    timers.current.push(setTimeout(run, ms));
  };
}

/** Square light-blue control next to the flashcard (prev / audio / next). */
function FlashButton({ icon, label, onPress, disabled }: { icon: 'back' | 'arrow' | 'audio'; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={cn('press h-11 w-11 items-center justify-center rounded-control bg-[#f2f7ff] active:opacity-80', disabled && 'opacity-40')}
    >
      <Icon name={icon} size={19} color={colors.ink} />
    </Pressable>
  );
}

function AudioButton({ word }: { word: string }) {
  const { t } = useTranslation();
  const play = useWordTextAudio(word);
  return <FlashButton icon="audio" label={t('oyna.pronunciation')} disabled={!play} onPress={() => play?.()} />;
}

// ---------------- Flashcards ----------------

export function CardsStep({ words }: { words: GameWord[] }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const lang = useDefinitionLanguage();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = words[index]!;
  const go = (i: number) => {
    setIndex(i);
    setFlipped(false);
  };
  return (
    <View>
      <ExerciseTitle>{t('oyna.learnWords')}</ExerciseTitle>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('oyna.flipCard')}
        accessibilityState={{ expanded: flipped }}
        onPress={() => {
          haptics.selection();
          setFlipped((f) => !f);
        }}
        className="press min-h-[180px] items-center justify-center gap-3.5 rounded-[20px] px-[18px] py-6 active:opacity-95"
        style={{ backgroundImage: 'linear-gradient(140deg, #4a93ff, #1e75f4)', boxShadow: '0 8px 20px rgba(30, 117, 244, 0.1)' }}
      >
        {flipped && card.imageUrl ? (
          <Image source={{ uri: card.imageUrl }} style={{ width: 72, height: 72, borderRadius: 14 }} contentFit="cover" />
        ) : null}
        <Text className="text-center font-body-semibold text-[28px] leading-[36px] text-white">{ct(card.word)}</Text>
        <Text className="text-center font-body text-[13px] leading-[20px] text-white/85">
          {flipped ? displayTranslation(card.translation, lang) : t('oyna.flipCard')}
        </Text>
      </Pressable>
      <View className="mt-3.5 flex-row items-center justify-center gap-3.5">
        <FlashButton icon="back" label={t('oyna.previous')} onPress={() => go(index - 1)} disabled={index === 0} />
        <Text className="font-body-medium text-[13px] leading-[19.5px] text-[#7a8090]" accessibilityLiveRegion="polite">
          {index + 1} / {words.length}
        </Text>
        <AudioButton word={card.word} />
        <FlashButton icon="arrow" label={t('oyna.next')} onPress={() => go(index + 1)} disabled={index === words.length - 1} />
      </View>
    </View>
  );
}

// ---------------- Shuffled letters ----------------

/** Answer well: the letters picked so far (tap one to put it back). */
function AnswerWell({ letters, state, onRemove }: { letters: { key: string; letter: string }[]; state: 'idle' | 'correct' | 'wrong'; onRemove?: (key: string) => void }) {
  const { style } = useAnswerMotion(state);
  return (
    <Animated.View style={style}>
      <View
        className={cn(
          'transition-tone mt-6 min-h-[46px] flex-row flex-wrap items-center gap-1 rounded-[11px] border px-3 py-2',
          state === 'correct' ? 'border-success bg-[#edf8ef]' : state === 'wrong' ? 'border-danger bg-danger-soft' : 'border-transparent bg-[#f7f9fd]',
        )}
      >
        {letters.map((l) => (
          <Pressable key={l.key} accessibilityRole="button" accessibilityLabel={l.letter} onPress={() => onRemove?.(l.key)} disabled={!onRemove} hitSlop={4}>
            <Text className={cn('font-body-medium text-[22px] leading-[28px]', state === 'correct' ? 'text-[#2f6b3f]' : 'text-ink')}>{l.letter}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

export function ShuffleStep({ pairs, words, onDone, toast }: { pairs: { shuffled: string; word?: string | null }[]; words: GameWord[]; onDone: () => void; toast: Toast }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const lang = useDefinitionLanguage();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const pair = pairs[index]!;
  const target = pair.word ?? '';
  const letters = [...pair.shuffled.toLocaleUpperCase()];
  const translation = displayTranslation(words.find((w) => w.word === target)?.translation, lang);
  const later = useLater();

  const pick = (i: number) => {
    if (state === 'correct' || picked.includes(i) || picked.length >= letters.length) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length < letters.length) return setState('idle');
    if (sameWord(next.map((j) => letters[j]).join(''), target)) {
      setState('correct');
      haptics.success();
      later(() => {
        if (index < pairs.length - 1) {
          setIndex(index + 1);
          setPicked([]);
          setState('idle');
        } else onDone();
      }, 700);
    } else {
      setState('wrong');
      haptics.error();
      toast(t('oyna.tryAgain'));
      // Like the gap step: clear the wrong order so the student can try again.
      later(() => {
        setPicked([]);
        setState('idle');
      }, 900);
    }
  };

  return (
    <View>
      <ExerciseTitle aside={pairs.length > 1 ? `${index + 1} / ${pairs.length}` : undefined}>{t('oyna.steps.shuffle')}</ExerciseTitle>
      {translation ? <Hint>«{translation}»</Hint> : null}
      <View className="flex-row flex-wrap gap-1.5">
        {letters.map((l, i) => (
          <Chip key={`${l}-${i}`} big label={ct(l)} tone={picked.includes(i) ? 'used' : 'idle'} onPress={() => pick(i)} disabled={picked.includes(i)} />
        ))}
      </View>
      <AnswerWell
        letters={picked.map((i) => ({ key: String(i), letter: ct(letters[i]!) }))}
        state={state}
        onRemove={
          state === 'correct'
            ? undefined
            : (key) => {
                setPicked((p) => p.filter((i) => String(i) !== key));
                setState('idle');
              }
        }
      />
    </View>
  );
}

// ---------------- Fill the gaps ----------------

type CompletePair = { word: string; unfinished: string; letters: string };

export function CompleteStep({ pairs, words, onDone, toast }: { pairs: CompletePair[]; words: GameWord[]; onDone: () => void; toast: Toast }) {
  const { t } = useTranslation();
  const lang = useDefinitionLanguage();
  const [index, setIndex] = useState(0);
  const pair = pairs[index]!;
  const translation = displayTranslation(words.find((w) => w.word === pair.word)?.translation, lang);
  return (
    <View>
      <ExerciseTitle aside={pairs.length > 1 ? `${index + 1} / ${pairs.length}` : undefined}>{t('oyna.steps.complete')}</ExerciseTitle>
      <Hint>{translation ? `«${translation}» · ${t('oyna.completeHint')}` : t('oyna.completeHint')}</Hint>
      <CompleteWord
        key={index}
        pair={pair}
        toast={toast}
        onSolved={() => {
          if (index < pairs.length - 1) setIndex(index + 1);
          else onDone();
        }}
      />
    </View>
  );
}

function CompleteWord({ pair, toast, onSolved }: { pair: CompletePair; toast: Toast; onSolved: () => void }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const pattern = useMemo(() => parsePattern(pair.unfinished), [pair.unfinished]);
  const pool = [...pair.letters];
  // which pool tile fills each gap (index into pool), aligned with pattern
  const [filledBy, setFilledBy] = useState<(number | null)[]>(() => pattern.map(() => null));
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const slots = pattern.map((ch, i) => ch ?? (filledBy[i] != null ? pool[filledBy[i]!]! : null));
  const used = new Set(filledBy.filter((x): x is number => x != null));
  const later = useLater();
  const { style: slotsMotion } = useAnswerMotion(state);

  const place = (tile: number) => {
    if (state !== 'idle' || used.has(tile)) return;
    const gap = pattern.findIndex((ch, i) => ch === null && filledBy[i] == null);
    if (gap < 0) return;
    const nextFilled = [...filledBy];
    nextFilled[gap] = tile;
    setFilledBy(nextFilled);
    const nextSlots = fillGap(slots, pool[tile]!);
    if (!slotsFilled(nextSlots)) return;
    if (sameWord(slotsWord(nextSlots), pair.word)) {
      setState('correct');
      haptics.success();
      later(onSolved, 700);
    } else {
      setState('wrong');
      haptics.error();
      toast(t('oyna.tryAgain'));
      later(() => {
        setFilledBy(pattern.map(() => null));
        setState('idle');
      }, 900);
    }
  };

  return (
    <>
      <Animated.View style={[{ marginTop: 4, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, slotsMotion]}>
        {slots.map((ch, i) => {
          const gap = pattern[i] === null;
          return (
            <Pressable
              key={i}
              accessibilityRole={gap ? 'button' : 'text'}
              disabled={!gap || filledBy[i] == null || state !== 'idle'}
              onPress={() => setFilledBy((f) => f.map((x, j) => (j === i ? null : x)))}
              className={cn(
                'press h-[46px] w-10 items-center justify-center rounded-tile',
                state === 'correct' ? 'bg-[#edf8ef]' : state === 'wrong' ? 'bg-danger-soft' : gap ? 'border border-dashed border-[#c9d3e3] bg-[#f7f9fd]' : 'bg-[#f3f5f2]',
              )}
            >
              <Text className={cn('font-body-medium text-[22px] leading-[28px]', gap && 'text-link', state === 'correct' && 'text-[#2f6b3f]')}>
                {ch ? ct(ch.toLocaleUpperCase()) : ''}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
      <View className="flex-row flex-wrap gap-1.5">
        {pool.map((l, i) => (
          <Chip key={`${l}-${i}`} big label={ct(l.toLocaleUpperCase())} tone={used.has(i) ? 'used' : 'idle'} disabled={used.has(i)} onPress={() => place(i)} />
        ))}
      </View>
    </>
  );
}

// ---------------- Topic tiles ----------------

export function TilesStep({ tiles, topic, onDone, toast }: { tiles: { word: string; correct: boolean }[]; topic: string; onDone: () => void; toast: Toast }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const pages = useMemo(() => chunk(tiles, 9), [tiles]);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const current = pages[page] ?? [];
  const later = useLater();

  const pick = (i: number) => {
    if (picked.has(i)) return;
    const next = new Set(picked).add(i);
    setPicked(next);
    if (current[i]!.correct) haptics.success();
    else {
      haptics.error();
      toast(t('oyna.tryAgain'));
    }
    if (tilesPageDone(current, next)) {
      later(() => {
        if (page < pages.length - 1) {
          setPage(page + 1);
          setPicked(new Set());
        } else onDone();
      }, 700);
    }
  };

  return (
    <View>
      <ExerciseTitle aside={pages.length > 1 ? `${page + 1} / ${pages.length}` : undefined}>{t('oyna.steps.tiles')}</ExerciseTitle>
      <Hint>{t('oyna.tilesHint')}</Hint>
      {topic ? (
        <View className="mb-4 self-start rounded-tile bg-primary-soft px-3 py-2">
          <Text className="font-body-semibold text-[14px] leading-[20px] text-link">{ct(topic)}</Text>
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {current.map((tile, i) => {
          const tone = picked.has(i) ? (tile.correct ? 'correct' : 'wrong') : 'idle';
          return (
            <ListChoice key={`${page}-${i}`} tone={tone} disabled={picked.has(i)} onPress={() => pick(i)} className="w-[31.8%] items-center px-1.5">
              <ChoiceLabel tone={tone} className="text-center text-[14px] leading-[18px]">
                {ct(tile.word)}
              </ChoiceLabel>
            </ListChoice>
          );
        })}
      </View>
    </View>
  );
}

// ---------------- Word search ----------------

export function GridStep({ rows, words, onDone, toast }: { rows: string[]; words: string[]; onDone: () => void; toast: Toast }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const foundCells = useMemo(() => new Set(found.flatMap((w) => (locateWord(rows, w) ?? []).map((c) => `${c.row}:${c.col}`))), [found, rows]);
  const grid = rows.map((r) => [...r.toLocaleUpperCase()]);
  const later = useLater();

  const tap = (cell: Cell) => {
    if (!anchor) {
      haptics.selection();
      return setAnchor(cell);
    }
    if (anchor.row === cell.row && anchor.col === cell.col) return setAnchor(null);
    const line = lineBetween(anchor, cell);
    setAnchor(null);
    const word = line ? gridWordAt(rows, words, line, new Set(found)) : null;
    if (!word) {
      haptics.error();
      return toast(t('oyna.tryAgain'));
    }
    haptics.success();
    const next = [...found, word];
    setFound(next);
    if (next.length === words.length) later(onDone, 500);
  };

  return (
    <View>
      <ExerciseTitle aside={`${found.length} / ${words.length}`}>{t('oyna.steps.grid')}</ExerciseTitle>
      <Hint>{t('oyna.gridHint')}</Hint>
      <View className="my-4 gap-1">
        {grid.map((row, r) => (
          <View key={r} className="flex-row gap-1">
            {row.map((letter, c) => {
              const isAnchor = anchor?.row === r && anchor.col === c;
              const isFound = foundCells.has(`${r}:${c}`);
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={letter}
                  accessibilityState={{ selected: isAnchor }}
                  onPress={() => tap({ row: r, col: c })}
                  className={cn('press aspect-square flex-1 items-center justify-center rounded-lg', isAnchor ? 'bg-[#fff2b8]' : isFound ? 'bg-[#edf8ef]' : 'bg-canvas')}
                  style={{ boxShadow: isAnchor ? 'inset 0 0 0 2px #242631' : 'inset 0 0 0 1px #d3d5de' }}
                >
                  <Text className={cn('font-body text-[17px] leading-[22px]', isFound && 'text-[#2f6b3f]')}>{ct(letter)}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {words.map((w) => (
          <Chip key={w} label={ct(w)} tone={found.includes(w) ? 'correct' : 'idle'} />
        ))}
      </View>
    </View>
  );
}

// ---------------- Word recognition (clouds) ----------------

export interface CaptchaState {
  clouds: (string | null)[];
  lives: number;
  found: number;
  finished: boolean;
}

export const CAPTCHA_LIVES = 3;

export function CaptchaStep({
  gameId,
  studentId,
  topic,
  state,
  setState,
  onDone,
  toast,
}: {
  gameId: string;
  studentId: string;
  topic: string;
  state: CaptchaState;
  setState: (update: (s: CaptchaState) => CaptchaState) => void;
  onDone: () => void;
  toast: Toast;
}) {
  const { t } = useTranslation();
  const ct = useContentText();
  const [flash, setFlash] = useState<{ index: number; correct: boolean } | null>(null);
  const busy = useRef(false);
  const [submit] = useMutation(OYNA_WORD_GAME_CAPTCHA_SUBMIT);

  const tap = async (index: number) => {
    const word = state.clouds[index];
    if (!word || busy.current || state.finished) return;
    busy.current = true;
    try {
      const { data } = await submit({ variables: { gameId, studentId, word } });
      const res = data?.wordGameCaptchaCloudSubmit;
      if (!res) throw new Error('no result');
      setFlash({ index, correct: res.correct });
      if (res.correct) haptics.success();
      else {
        haptics.error();
        toast(t('oyna.tryAgain'));
      }
      await new Promise((r) => setTimeout(r, 450));
      setFlash(null);
      setState((s) => {
        const lives = res.correct ? s.lives : s.lives - 1;
        const finished = (res.correct && res.left === 0) || lives <= 0;
        const clouds = s.clouds.map((c, i) => (i === index ? (res.newCloud?.word ?? null) : c));
        return { clouds, lives, found: s.found + (res.correct ? 1 : 0), finished };
      });
      if ((res.correct && res.left === 0) || (!res.correct && state.lives - 1 <= 0)) onDone();
    } catch {
      toast(t('oyna.submitFailed'));
    } finally {
      busy.current = false;
    }
  };

  return (
    <View>
      <ExerciseTitle aside={t('oyna.foundCount', { n: state.found })}>{t('oyna.steps.captcha')}</ExerciseTitle>
      <Hint>{t('oyna.captchaHint', { topic: ct(topic) })}</Hint>
      <View className="mb-4 flex-row items-center gap-1.5" accessibilityLabel={`${t('oyna.lives')}: ${state.lives}`}>
        {Array.from({ length: CAPTCHA_LIVES }, (_, i) => (
          <Icon key={i} name={i < state.lives ? 'solid-heart' : 'heart'} size={20} color={colors.attention} />
        ))}
      </View>
      {state.finished ? (
        <View className="flex-row items-center gap-2 rounded-card bg-[#edf8ef] p-[14px]">
          <Icon name="check" size={20} color={colors.success} />
          <Text className="flex-1 font-body-semibold text-[15px] leading-[22px] text-[#2f6b3f]">{t('oyna.activityCompleted')}</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-[9px]">
          {state.clouds.map((word, i) =>
            word ? (
              <ListChoice
                key={`${i}-${word}`}
                tone={flash?.index === i ? (flash.correct ? 'correct' : 'wrong') : 'idle'}
                onPress={() => void tap(i)}
                className="w-[48.8%] items-center"
              >
                <ChoiceLabel tone={flash?.index === i ? (flash.correct ? 'correct' : 'wrong') : 'idle'} className="text-center">
                  {ct(word)}
                </ChoiceLabel>
              </ListChoice>
            ) : null,
          )}
        </View>
      )}
    </View>
  );
}

// ---------------- Matching ----------------

export function MatchStep({
  pairs,
  state,
  setState,
  toast,
}: {
  pairs: { word: string; translation: string }[];
  state: MatchState;
  setState: (s: MatchState) => void;
  toast: Toast;
}) {
  const { t } = useTranslation();
  const ct = useContentText();
  const lang = useDefinitionLanguage();
  const right = useMemo(() => shuffled([...new Set(pairs.map((p) => p.translation))]), [pairs]);
  const [word, setWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const matchedTranslations = new Set(pairs.filter((p) => state.matched.includes(p.word)).map((p) => p.translation));
  // A wrong pair shows red on both tiles for a moment, not only in the toast.
  const [miss, setMiss] = useState<{ word: string; translation: string } | null>(null);

  useEffect(() => {
    if (!miss) return;
    const timer = setTimeout(() => setMiss(null), 700);
    return () => clearTimeout(timer);
  }, [miss]);

  const attempt = (w: string | null, tr: string | null) => {
    setWord(w);
    setTranslation(tr);
    if (!w || !tr) {
      haptics.selection();
      return;
    }
    const correct = pairs.find((p) => p.word === w)!.translation;
    const res = pickMatch(state, w, tr, correct);
    setState(res.state);
    if (res.correct) haptics.success();
    else {
      haptics.error();
      setMiss({ word: w, translation: tr });
      toast(t('oyna.tryAgain'));
    }
    setWord(null);
    setTranslation(null);
  };

  return (
    <View>
      <ExerciseTitle>{t('oyna.steps.match')}</ExerciseTitle>
      <Hint>{t('oyna.matchHint')}</Hint>
      <View className="flex-row gap-2">
        <View className="flex-1 gap-[9px]">
          {pairs.map((p) => {
            const done = state.matched.includes(p.word);
            const tone = done ? 'correct' : miss?.word === p.word ? 'wrong' : word === p.word ? 'selected' : 'idle';
            return (
              <ListChoice key={p.word} tone={tone} disabled={done} onPress={() => attempt(word === p.word ? null : p.word, translation)}>
                <ChoiceLabel tone={tone}>{ct(p.word)}</ChoiceLabel>
              </ListChoice>
            );
          })}
        </View>
        <View className="flex-1 gap-[9px]">
          {right.map((tr) => {
            const done = matchedTranslations.has(tr);
            const tone = done ? 'correct' : miss?.translation === tr ? 'wrong' : translation === tr ? 'selected' : 'idle';
            return (
              <ListChoice key={tr} tone={tone} disabled={done} onPress={() => attempt(word, translation === tr ? null : tr)}>
                <ChoiceLabel tone={tone}>{displayTranslation(tr, lang)}</ChoiceLabel>
              </ListChoice>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------- Multiple choice ----------------

const LETTERS = 'ABCDEFGH';

export function McqStep({ questions, picked, setPicked, onDone }: { questions: McqQuestion[]; picked: (string | undefined)[]; setPicked: (p: (string | undefined)[]) => void; onDone: () => void }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const lang = useDefinitionLanguage();
  const firstOpen = picked.length < questions.length ? picked.length : questions.length - 1;
  const [index, setIndex] = useState(Math.min(firstOpen, questions.length - 1));
  const q = questions[index]!;
  const options = useMemo(() => shuffled(q.options), [q]);
  const answer = mcqAnswer(q);
  const chosen = picked[index];
  const prompt = q.options[0];
  const later = useLater();

  const choose = (word: string) => {
    if (chosen !== undefined) return;
    const next = [...picked];
    next[index] = word;
    setPicked(next);
    if (word === answer) haptics.success();
    else haptics.error();
    later(() => {
      if (index < questions.length - 1) setIndex(index + 1);
      else onDone();
    }, 900);
  };

  return (
    <View>
      <ExerciseTitle aside={`${index + 1} / ${questions.length}`}>{t('oyna.steps.mcq')}</ExerciseTitle>
      <Hint>{t('oyna.mcqHint')}</Hint>
      {prompt?.imageUrl ? (
        <Image source={{ uri: prompt.imageUrl }} style={{ width: '100%', height: 170, borderRadius: 16, marginBottom: 12 }} contentFit="cover" />
      ) : null}
      <Text className="mb-2.5 mt-1 font-body-semibold text-[16px] leading-[23px]">{displayTranslation(prompt?.translation, lang)}</Text>
      <View className="gap-[9px]">
        {options.map((o, i) => {
          const tone = chosen === undefined ? 'idle' : o.word === answer ? 'correct' : o.word === chosen ? 'wrong' : 'idle';
          return <OptionRow key={o.word} letter={LETTERS[i] ?? '·'} label={ct(o.word)} tone={tone} disabled={chosen !== undefined} onPress={() => choose(o.word)} />;
        })}
      </View>
    </View>
  );
}
