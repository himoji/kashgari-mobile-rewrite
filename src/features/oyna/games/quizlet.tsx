import { useMutation, useSuspenseQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile, useSession } from '@/features/auth/session';
import { OYNA_QUIZLET_GAME, OYNA_QUIZLET_SUBMIT } from '@/features/oyna/gql';
import { cleanBoards, guessedPayload, quizletSeconds, type QuizletCard } from '@/features/oyna/logic/quizlet';
import { shuffled } from '@/features/oyna/logic/shuffle';
import { displayTranslation } from '@/features/oyna/logic/translation';
import { ChoiceLabel, ExerciseTitle, Hint, ListChoice, Outline } from '@/features/oyna/parts';
import { ConfirmSubmit, PlayerActions, PlayerFrame, useToast } from '@/features/oyna/player-frame';
import { PlayerError, PlayerLoading } from '@/features/oyna/player-states';
import { OynaResultView } from '@/features/oyna/result/oyna-result';
import { useSessionClock } from '@/features/oyna/use-session-clock';
import { evictSubmission } from '@/lib/cache';
import { haptics } from '@/lib/haptics';
import type { OynaQuizletGameQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';

type Game = NonNullable<OynaQuizletGameQuery['quizletGame']>;

export function QuizletPlayer({ id }: { id: string }) {
  return (
    <QueryBoundary fallback={<PlayerLoading />} errorFallback={(retry) => <PlayerError onRetry={retry} />}>
      <QuizletLoad id={id} />
    </QueryBoundary>
  );
}

function QuizletLoad({ id }: { id: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_QUIZLET_GAME, { variables: { id, studentId: profileId }, queryKey });
  if (!data.quizletGame) return <PlayerError />;
  if (data.quizletGame.submission) return <OynaResultView kind="quizlet" id={id} />;
  return <QuizletRun game={data.quizletGame} studentId={profileId} />;
}

/** One board: Kazakh words on the left, meanings (or pictures) on the right, as in student-player-a6. */
function Board({ cards, images, matched, onMatch, onMiss }: { cards: QuizletCard[]; images: boolean; matched: string[]; onMatch: (word: string) => void; onMiss: () => void }) {
  const ct = useContentText();
  const lang = useSession((s) => s.definitionLanguage);
  // Shuffled once per board (the board is keyed by its index).
  const [right] = useState(() => shuffled(cards));
  const [word, setWord] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  // A wrong pair shows red on both tiles for a moment.
  const [miss, setMiss] = useState<{ word: string; meaning: string } | null>(null);

  useEffect(() => {
    if (!miss) return;
    const timer = setTimeout(() => setMiss(null), 700);
    return () => clearTimeout(timer);
  }, [miss]);

  const attempt = (w: string | null, m: string | null) => {
    setWord(w);
    setMeaning(m);
    if (!w || !m) {
      haptics.selection();
      return;
    }
    if (w === m) {
      haptics.success();
      onMatch(w);
    } else {
      haptics.error();
      setMiss({ word: w, meaning: m });
      onMiss();
    }
    setWord(null);
    setMeaning(null);
  };

  return (
    <View className="flex-row gap-2">
      <View className="flex-1 gap-[9px]">
        {cards.map((c) => {
          const tone = matched.includes(c.word) ? 'correct' : miss?.word === c.word ? 'wrong' : word === c.word ? 'selected' : 'idle';
          return (
            <ListChoice key={c.word} tone={tone} disabled={tone === 'correct'} onPress={() => attempt(word === c.word ? null : c.word, meaning)} className={images ? 'min-h-[76px]' : undefined}>
              <ChoiceLabel tone={tone}>{ct(c.word)}</ChoiceLabel>
            </ListChoice>
          );
        })}
      </View>
      <View className="flex-1 gap-[9px]">
        {right.map((c) => {
          const tone = matched.includes(c.word) ? 'correct' : miss?.meaning === c.word ? 'wrong' : meaning === c.word ? 'selected' : 'idle';
          return (
            <ListChoice key={c.word} tone={tone} disabled={tone === 'correct'} onPress={() => attempt(word, meaning === c.word ? null : c.word)} className={images ? 'min-h-[76px] items-center p-1.5' : undefined}>
              {images && c.imageUrl ? (
                <Image source={{ uri: c.imageUrl }} style={{ width: '100%', height: 62, borderRadius: 10 }} contentFit="contain" accessibilityLabel={displayTranslation(c.translation, lang)} />
              ) : (
                <ChoiceLabel tone={tone}>{displayTranslation(c.translation, lang)}</ChoiceLabel>
              )}
            </ListChoice>
          );
        })}
      </View>
    </View>
  );
}

function QuizletRun({ game, studentId }: { game: Game; studentId: string }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const { toast, showToast } = useToast();
  // matched words are kept per API board index; empty boards are skipped when playing
  const all = cleanBoards(game.boards);
  const boards = all.map((cards, at) => ({ cards, at })).filter((b) => b.cards.length > 0);
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState<string[][]>(() => all.map(() => []));
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submit, { loading: submitting }] = useMutation(OYNA_QUIZLET_SUBMIT, {
    update: (cache) => evictSubmission(cache, { __typename: 'OynaGameQuizlet', id: game.id }, studentId),
  });

  const send = async (time: number) => {
    // No try/catch around the result checks: the compiler can't optimise those yet.
    const ok = await submit({
      variables: { gameId: game.id, studentId, data: { time, guessed: guessedPayload(all.length, matched) } },
    }).then(({ data }) => !!data?.quizletSubmit, () => false);
    setConfirm(false);
    if (ok) {
      haptics.success();
      setSubmitted(true);
    } else showToast(t('oyna.submitFailed'));
  };

  const clock = useSessionClock(quizletSeconds(game.duration), !submitted, (spent) => {
    showToast(t('oyna.timeUp'));
    void send(spent);
  });

  if (submitted) return <OynaResultView kind="quizlet" id={game.id} />;
  if (!boards.length) return <PlayerError message={t('oyna.empty')} />;

  const { cards, at } = boards[index]!;
  const boardDone = (matched[at]?.length ?? 0) === cards.length;
  const doneCount = boards.filter((b) => (matched[b.at]?.length ?? 0) === b.cards.length).length;
  const last = index === boards.length - 1;

  return (
    <PlayerFrame
      title={ct(game.name)}
      caption={boards.length > 1 ? `${t('oyna.stepOf', { n: index + 1, total: boards.length })} · ${t('oyna.kinds.quizlet')}` : t('oyna.kinds.quizlet')}
      progress={boards.length > 1 ? doneCount / boards.length : undefined}
      timer={clock.timer}
      outline={<Outline label={t('oyna.words')} words={all.flat().map((c) => c.word)} />}
      footer={
        <PlayerActions
          label={last ? t('oyna.submit') : t('oyna.next')}
          icon={last ? 'check' : 'arrow'}
          onPress={() => {
            if (!boardDone) return showToast(t('oyna.finishActivity'));
            if (last) setConfirm(true);
            else setIndex(index + 1);
          }}
        />
      }
      toast={toast}
    >
      <ExerciseTitle>{t('oyna.steps.match')}</ExerciseTitle>
      <Hint>{t('oyna.matchHint')}</Hint>
      <Board
        key={index}
        cards={cards}
        images={game.dataType === 'IMAGE'}
        matched={matched[at] ?? []}
        onMatch={(word) => setMatched((prev) => prev.map((m, i) => (i === at ? [...m, word] : m)))}
        onMiss={() => showToast(t('oyna.tryAgain'))}
      />
      <ConfirmSubmit visible={confirm} loading={submitting} onCancel={() => setConfirm(false)} onConfirm={() => void send(clock.spent())} />
    </PlayerFrame>
  );
}
