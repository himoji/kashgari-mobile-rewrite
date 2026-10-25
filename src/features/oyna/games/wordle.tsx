import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { Delete } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { OYNA_WORDLE_CHECK, OYNA_WORDLE_GAME, OYNA_WORDLE_SUBMIT } from '@/features/oyna/gql';
import {
  WORDLE_MAX_GUESSES,
  evaluateGuess,
  isSolved,
  isWordDone,
  keyStates,
  keyboardRows,
  wordleGuessesPayload,
  type LetterState,
} from '@/features/oyna/logic/wordle';
import { ExerciseTitle, Hint, Outline } from '@/features/oyna/parts';
import { ConfirmSubmit, PlayerActions, PlayerFrame, useToast } from '@/features/oyna/player-frame';
import { PlayerError, PlayerLoading } from '@/features/oyna/player-states';
import { OynaResultView } from '@/features/oyna/result/oyna-result';
import { useSessionClock } from '@/features/oyna/use-session-clock';
import { evictSubmission } from '@/lib/cache';
import type { OynaWordleGameQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { cn } from '@/ui/cn';
import { Text } from '@/ui/text';

type Game = NonNullable<OynaWordleGameQuery['wordleGame']>;

export function WordlePlayer({ id }: { id: string }) {
  const { profileId } = useProfile();
  const { data, loading, error, refetch } = useQuery(OYNA_WORDLE_GAME, { variables: { id, studentId: profileId } });
  if (loading) return <PlayerLoading />;
  if (error || !data?.wordleGame) return <PlayerError onRetry={() => void refetch()} />;
  if (data.wordleGame.submission) return <OynaResultView kind="wordle" id={id} />;
  return <WordleRun game={data.wordleGame} studentId={profileId} />;
}

const cellTone: Record<LetterState | 'typed' | 'empty', string> = {
  correct: 'bg-[#e8f6ef] border-success',
  present: 'bg-[#fff8d6] border-[#e5b800]',
  absent: 'bg-[#eceff4] border-[#eceff4]',
  typed: 'bg-canvas border-[#9aa3b5]',
  empty: 'bg-canvas border-[#d3d5de]',
};

/** One board row: a past guess, the row being typed, or an empty row. */
export function WordleRow({ letters, states, length, size }: { letters: string; states?: LetterState[]; length: number; size: number }) {
  const ct = useContentText();
  const chars = [...letters];
  return (
    <View className="mb-1.5 flex-row justify-center gap-1.5">
      {Array.from({ length }, (_, i) => {
        const tone = states?.[i] ?? (chars[i] ? 'typed' : 'empty');
        return (
          <View key={i} className={cn('items-center justify-center rounded-[9px] border', cellTone[tone])} style={{ width: size, height: size }}>
            <Text className={cn('font-body-semibold text-[22px] leading-[28px]', tone === 'absent' && 'text-subtle', tone === 'correct' && 'text-[#1b6e4f]')}>
              {chars[i] ? ct(chars[i]!) : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Keyboard({ rows, states, onKey, onDelete }: { rows: string[][]; states: Record<string, LetterState>; onKey: (k: string) => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const ct = useContentText();
  return (
    <View className="mt-3 gap-1.5">
      {rows.map((row, r) => (
        <View key={r} className="flex-row justify-center gap-1">
          {row.map((k) => {
            const s = states[k];
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={k}
                onPress={() => onKey(k)}
                className={cn(
                  'h-10 max-w-[34px] flex-1 items-center justify-center rounded-lg active:opacity-70',
                  s === 'correct' ? 'bg-[#e8f6ef]' : s === 'present' ? 'bg-[#fff8d6]' : s === 'absent' ? 'bg-[#e3e6ec]' : 'bg-canvas',
                )}
                style={{ boxShadow: 'inset 0 0 0 1px #d3d5de' }}
              >
                <Text className={cn('font-body-medium text-[16px] leading-[20px]', s === 'absent' && 'text-subtle', s === 'correct' && 'text-[#1b6e4f]')}>{ct(k)}</Text>
              </Pressable>
            );
          })}
          {r === rows.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('oyna.deleteLetter')}
              onPress={onDelete}
              className="h-10 w-[52px] items-center justify-center rounded-lg bg-track active:opacity-70"
            >
              <Delete size={20} color={colors.link} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function WordleRun({ game, studentId }: { game: Game; studentId: string }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const client = useApolloClient();
  const { language } = useProfile();
  const { width } = useWindowDimensions();
  const { toast, showToast } = useToast();
  const words = game.words.map((w) => w.toLocaleUpperCase());
  const [wordIndex, setWordIndex] = useState(0);
  const [guesses, setGuesses] = useState<string[][]>(() => words.map(() => []));
  const [typed, setTyped] = useState('');
  const [checking, setChecking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submit, { loading: submitting }] = useMutation(OYNA_WORDLE_SUBMIT, {
    update: (cache) => evictSubmission(cache, { __typename: 'OynaGameWordle', id: game.id }, studentId),
  });

  const clock = useSessionClock(game.duration > 0 ? game.duration : null, !submitted, () => {
    showToast(t('oyna.timeUp'));
    void send();
  });

  async function send() {
    try {
      const { data } = await submit({
        variables: { gameId: game.id, studentId, data: { time: clock.spent(), guesses: wordleGuessesPayload(words, guesses) } },
      });
      setConfirm(false);
      if (data?.wordleSubmit) setSubmitted(true);
      else showToast(t('oyna.submitFailed'));
    } catch {
      setConfirm(false);
      showToast(t('oyna.submitFailed'));
    }
  }

  if (submitted) return <OynaResultView kind="wordle" id={game.id} />;

  const target = words[wordIndex] ?? '';
  const length = [...target].length;
  const mine = guesses[wordIndex] ?? [];
  const wordDone = isWordDone(mine, target);
  const solved = isSolved(mine, target);
  const last = wordIndex === words.length - 1;
  const doneCount = guesses.filter((g, i) => isWordDone(g, words[i] ?? '')).length;
  const size = Math.min(42, Math.floor((Math.min(width, 430) - 40 - 6 * (length - 1)) / Math.max(length, 1)));

  const type = (k: string) => {
    if (wordDone || [...typed].length >= length) return;
    setTyped(typed + k);
  };

  const check = async () => {
    if ([...typed].length !== length || checking) return;
    setChecking(true);
    let valid = true;
    try {
      const { data } = await client.query({ query: OYNA_WORDLE_CHECK, variables: { word: typed } });
      valid = data?.wordleCheckWord !== false;
    } catch {
      // the old app accepted the guess when the dictionary check failed
    }
    setChecking(false);
    if (!valid) return showToast(t('oyna.notAWord'));
    setGuesses((all) => all.map((g, i) => (i === wordIndex ? [...g, typed] : g)));
    setTyped('');
  };

  const primary = () => {
    if (!wordDone) return void check();
    if (!last) {
      setWordIndex(wordIndex + 1);
      setTyped('');
      return;
    }
    setConfirm(true);
  };

  const rows = Array.from({ length: WORDLE_MAX_GUESSES }, (_, r) => {
    if (r < mine.length) return { letters: mine[r]!, states: evaluateGuess(mine[r]!, target) };
    if (r === mine.length && !wordDone) return { letters: typed };
    return { letters: '' };
  });

  return (
    <PlayerFrame
      title={ct(game.name)}
      caption={words.length > 1 ? `${t('oyna.stepOf', { n: wordIndex + 1, total: words.length })} · ${t('oyna.kinds.wordle')}` : t('oyna.kinds.wordle')}
      progress={words.length > 1 ? doneCount / words.length : undefined}
      timer={clock.remaining}
      outline={words.length > 1 ? <Outline label={t('oyna.order', { done: doneCount, total: words.length })} steps={words.map((_, i) => ({ label: `${t('oyna.word')} ${i + 1}`, icon: 'game', active: i === wordIndex, done: isWordDone(guesses[i] ?? [], words[i] ?? '') }))} /> : undefined}
      footer={
        <PlayerActions
          label={!wordDone ? t('oyna.guess') : last ? t('oyna.submit') : t('oyna.next')}
          icon={!wordDone || last ? 'check' : 'arrow'}
          onPress={primary}
          disabled={!wordDone && [...typed].length !== length}
          loading={checking}
        />
      }
      toast={toast}
    >
      <ExerciseTitle>{t('oyna.kinds.wordle')}</ExerciseTitle>
      <Hint>{t('oyna.wordleHint')}</Hint>
      <View className="mt-2">
        {rows.map((row, r) => (
          <WordleRow key={r} letters={row.letters} states={row.states} length={length} size={size} />
        ))}
      </View>
      {wordDone ? (
        <Text className={cn('mt-3 text-center font-body-semibold text-[15px] leading-[22px]', solved ? 'text-success' : 'text-body')}>
          {solved ? t('oyna.wordleSolved') : t('oyna.wordleFailed', { word: ct(target) })}
        </Text>
      ) : (
        <Keyboard rows={keyboardRows(language)} states={keyStates(mine, target)} onKey={type} onDelete={() => setTyped([...typed].slice(0, -1).join(''))} />
      )}
      <ConfirmSubmit visible={confirm} loading={submitting} onCancel={() => setConfirm(false)} onConfirm={() => void send()} />
    </PlayerFrame>
  );
}
