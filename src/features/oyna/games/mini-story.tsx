import { useMutation, useSuspenseQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/auth/session';
import { OYNA_MINI_STORY_GAME, OYNA_MINI_STORY_SUBMIT } from '@/features/oyna/gql';
import { countWords, usedWords } from '@/features/oyna/logic/ministory';
import { Chip, ExerciseTitle, Hint, Outline } from '@/features/oyna/parts';
import { ConfirmSubmit, PlayerActions, PlayerFrame, useToast } from '@/features/oyna/player-frame';
import { PlayerError, PlayerLoading } from '@/features/oyna/player-states';
import { OynaResultView } from '@/features/oyna/result/oyna-result';
import { useSessionClock } from '@/features/oyna/use-session-clock';
import { evictSubmission } from '@/lib/cache';
import { haptics } from '@/lib/haptics';
import type { OynaMiniStoryGameQuery } from '@/graphql/graphql';
import { useContentText } from '@/lib/i18n';
import { colors } from '@/theme/colors';
import { QueryBoundary, useRetryKey } from '@/ui/query-boundary';
import { Text } from '@/ui/text';

type Game = NonNullable<OynaMiniStoryGameQuery['miniStoryGame']>;

export function MiniStoryPlayer({ id }: { id: string }) {
  return (
    <QueryBoundary fallback={<PlayerLoading />} errorFallback={(retry) => <PlayerError onRetry={retry} />}>
      <MiniStoryLoad id={id} />
    </QueryBoundary>
  );
}

function MiniStoryLoad({ id }: { id: string }) {
  const { profileId } = useProfile();
  const queryKey = useRetryKey();
  const { data } = useSuspenseQuery(OYNA_MINI_STORY_GAME, { variables: { id, studentId: profileId }, queryKey });
  if (!data.miniStoryGame) return <PlayerError />;
  if (data.miniStoryGame.submission) return <OynaResultView kind="ministory" id={id} />;
  return <MiniStoryRun game={data.miniStoryGame} studentId={profileId} />;
}

/** Mini story (student-player-a7): write a short story with the given words. */
function MiniStoryRun({ game, studentId }: { game: Game; studentId: string }) {
  const { t } = useTranslation();
  const ct = useContentText();
  const { toast, showToast } = useToast();
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submit, { loading: submitting }] = useMutation(OYNA_MINI_STORY_SUBMIT, {
    update: (cache) => evictSubmission(cache, { __typename: 'OynaGameMiniStory', id: game.id }, studentId),
  });
  const used = usedWords(game.words, text);


  const send = async (time: number) => {
    // No try/catch around the result checks: the compiler can't optimise those yet.
    const ok = await submit({ variables: { gameId: game.id, studentId, data: { time, text: text.trim() } } }).then(
      ({ data }) => !!data?.miniStorySubmit,
      () => false,
    );
    setConfirm(false);
    if (ok) {
      haptics.success();
      setSubmitted(true);
    } else showToast(t('oyna.submitFailed'));
  };

  const clock = useSessionClock(game.duration > 0 ? game.duration : null, !submitted, (spent) => {
    showToast(t('oyna.timeUp'));
    void send(spent);
  });

  if (submitted) return <OynaResultView kind="ministory" id={game.id} />;

  return (
    <PlayerFrame
      title={ct(game.name)}
      caption={t('oyna.kinds.ministory')}
      timer={clock.timer}
      outline={<Outline label={t('oyna.words')} words={game.words} />}
      footer={
        <PlayerActions
          label={t('oyna.submit')}
          icon="check"
          onPress={() => (text.trim() ? setConfirm(true) : showToast(t('oyna.emptyStory')))}
        />
      }
      toast={toast}
    >
      <ExerciseTitle>{t('oyna.kinds.ministory')}</ExerciseTitle>
      <Hint>{t('oyna.storyHint')}</Hint>
      <View className="my-5 flex-row flex-wrap gap-1.5">
        {game.words.map((w) => (
          <Chip key={w} label={ct(w)} tone={used.includes(w) ? 'correct' : 'idle'} onPress={() => router.push({ pathname: '/word', params: { word: w } })} />
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        placeholder={t('oyna.writeAnswer')}
        placeholderTextColor={colors.subtle}
        accessibilityLabel={t('oyna.writeAnswer')}
        className="min-h-[214px] rounded-[11px] border border-transparent bg-[#f7f9fd] px-3 py-2.5 font-reading text-[16px] leading-[24px] text-ink focus:border-primary"
      />
      <View className="mt-2 flex-row justify-between">
        <Text className="font-body text-[14px] leading-[21px] text-body">{t('oyna.wordCount', { n: countWords(text) })}</Text>
        <Text className="font-body text-[14px] leading-[21px] text-body">{t('oyna.wordsUsed', { n: used.length, total: game.words.length })}</Text>
      </View>
      <ConfirmSubmit visible={confirm} loading={submitting} onCancel={() => setConfirm(false)} onConfirm={() => void send(clock.spent())} />
    </PlayerFrame>
  );
}
