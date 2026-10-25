import { useMutation, useSuspenseQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { OYNA_WORD_GAME, OYNA_WORD_GAME_STATUS, OYNA_WORD_GAME_SUBMIT } from '@/features/oyna/gql';
import { emptyMatch, matchPayload, mcqPayload, wordSteps, type MatchState, type WordStep } from '@/features/oyna/logic/word-game';
import { Outline } from '@/features/oyna/parts';
import { ConfirmSubmit, PlayerActions, PlayerFrame, useToast } from '@/features/oyna/player-frame';
import { PlayerError, PlayerLoading } from '@/features/oyna/player-states';
import { OynaResultView } from '@/features/oyna/result/oyna-result';
import { useSessionClock } from '@/features/oyna/use-session-clock';
import { evictSubmission } from '@/lib/cache';
import type { OynaWordGameQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';

import {
  CAPTCHA_LIVES,
  CaptchaStep,
  CardsStep,
  CompleteStep,
  GridStep,
  MatchStep,
  McqStep,
  ShuffleStep,
  TilesStep,
  type CaptchaState,
} from './word-steps';

type Game = NonNullable<OynaWordGameQuery['wordGameGame']>;

/** Word game: flashcards, then recognize games, then drills; answers go to the API in one final submit. */
export function WordGamePlayer({ id }: { id: string }) {
  return (
    <QueryBoundary fallback={<PlayerLoading />} errorFallback={(retry) => <PlayerError onRetry={retry} />}>
      <WordGameStatus id={id} />
    </QueryBoundary>
  );
}

function WordGameStatus({ id }: { id: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_WORD_GAME_STATUS, { variables: { id, studentId: profileId }, fetchPolicy: 'network-only', queryKey });
  if (!data.wordGameGame) return <PlayerError />;
  if ((data.wordGameGame.submission?.time ?? 0) > 0) return <OynaResultView kind="wordgame" id={id} />;
  return <WordGameLoader id={id} studentId={profileId} />;
}

function WordGameLoader({ id, studentId }: { id: string; studentId: string }) {
  const queryKey = useRetryKey();
  // no-cache: the query restarts the captcha drill on the server, so never serve it from cache
  const { data } = useSuspenseQuery(OYNA_WORD_GAME, { variables: { id, studentId }, fetchPolicy: 'no-cache', queryKey });
  if (!data.wordGameGame) return <PlayerError />;
  return <WordGameRun game={data.wordGameGame} studentId={studentId} />;
}

function WordGameRun({ game, studentId }: { game: Game; studentId: string }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const { toast, showToast } = useToast();
  const steps = useMemo(() => wordSteps(game), [game]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<WordStep>>(() => new Set());
  const [furthest, setFurthest] = useState(0);
  const [match, setMatch] = useState<MatchState>(emptyMatch);
  const [mcq, setMcq] = useState<(string | undefined)[]>([]);
  const [captcha, setCaptcha] = useState<CaptchaState>(() => ({
    clouds: (game.drill.captcha?.clouds ?? []).map((c) => c.word),
    lives: CAPTCHA_LIVES,
    found: 0,
    finished: false,
  }));
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const clock = useSessionClock(null, !submitted);
  const [submit, { loading: submitting }] = useMutation(OYNA_WORD_GAME_SUBMIT, {
    update: (cache) => evictSubmission(cache, { __typename: 'OynaGameWordGame', id: game.id }, studentId),
  });

  const step = steps[index]!;
  const last = index === steps.length - 1;
  const words = game.words.map((w) => ({ word: w.word, translation: w.translation, imageUrl: w.imageUrl }));
  const topic = game.topicName ?? '';
  const matchPairs = game.drill.match ?? [];
  const mcqQuestions = game.drill.mcq ?? [];

  const markDone = (s: WordStep) => setDone((d) => new Set(d).add(s));
  const matchComplete = matchPairs.length > 0 && match.matched.length === new Set(matchPairs.map((p) => p.word)).size;
  const stepDone = step === 'cards' || done.has(step) || (step === 'match' && matchComplete) || (step === 'mcq' && mcq.filter((x) => x !== undefined).length === mcqQuestions.length);

  const goTo = (i: number) => {
    setIndex(i);
    setFurthest((f) => Math.max(f, i));
  };

  const next = () => {
    if (!stepDone) return showToast(t('oyna.finishActivity'));
    markDone(step);
    if (last) return setConfirm(true);
    goTo(index + 1);
  };

  const send = async () => {
    try {
      const { data } = await submit({
        variables: {
          gameId: game.id,
          studentId,
          data: {
            time: clock.spent(),
            match: matchPairs.length ? matchPayload(matchPairs, match) : null,
            mcq: mcqQuestions.length ? mcqPayload(mcqQuestions, mcq) : null,
          },
        },
      });
      setConfirm(false);
      if (data?.wordGameSubmit) setSubmitted(true);
      else showToast(t('oyna.submitFailed'));
    } catch {
      setConfirm(false);
      showToast(t('oyna.submitFailed'));
    }
  };

  if (submitted) return <OynaResultView kind="wordgame" id={game.id} />;

  const body = (() => {
    switch (step) {
      case 'cards':
        return <CardsStep words={words} />;
      case 'shuffle':
        return <ShuffleStep pairs={game.recognize.shuffle?.pairs ?? []} words={words} onDone={() => markDone('shuffle')} toast={showToast} />;
      case 'complete':
        return <CompleteStep pairs={game.recognize.complete?.pairs ?? []} words={words} onDone={() => markDone('complete')} toast={showToast} />;
      case 'tiles':
        return <TilesStep tiles={game.recognize.tiles?.tiles ?? []} topic={topic} onDone={() => markDone('tiles')} toast={showToast} />;
      case 'grid':
        return <GridStep rows={game.recognize.grid?.rows ?? []} words={game.recognize.grid?.words ?? []} onDone={() => markDone('grid')} toast={showToast} />;
      case 'captcha':
        return (
          <CaptchaStep
            gameId={game.id}
            studentId={studentId}
            topic={topic}
            state={captcha}
            setState={setCaptcha}
            onDone={() => markDone('captcha')}
            toast={showToast}
          />
        );
      case 'match':
        return <MatchStep pairs={matchPairs} state={match} setState={setMatch} toast={showToast} />;
      case 'mcq':
        return <McqStep questions={mcqQuestions} picked={mcq} setPicked={setMcq} onDone={() => markDone('mcq')} />;
    }
  })();

  return (
    <PlayerFrame
      title={ct(game.name || topic)}
      caption={steps.length > 1 ? `${t('oyna.stepOf', { n: index + 1, total: steps.length })} · ${t(`oyna.steps.${step}`)}` : t(`oyna.steps.${step}`)}
      progress={steps.length > 1 ? done.size / steps.length : undefined}
      outline={
        <Outline
          label={steps.length > 1 ? t('oyna.order', { done: done.size, total: steps.length }) : t('oyna.words')}
          steps={steps.length < 2 ? undefined : steps.map((s, i) => ({
            label: t(`oyna.steps.${s}`),
            icon: 'game',
            active: i === index,
            done: done.has(s),
            onPress: i <= furthest && i !== index ? () => goTo(i) : undefined,
          }))}
          words={game.words.map((w) => w.word)}
        />
      }
      footer={
        <PlayerActions
          label={last ? t('oyna.submit') : t('oyna.next')}
          icon={last ? 'check' : 'arrow'}
          onPress={next}
          onPrevious={index > 0 ? () => goTo(index - 1) : undefined}
        />
      }
      toast={toast}
    >
      {body}
      <ConfirmSubmit visible={confirm} loading={submitting} onCancel={() => setConfirm(false)} onConfirm={() => void send()} />
    </PlayerFrame>
  );
}
