import { useQuery } from '@apollo/client/react';
import { useAudioPlayer } from 'expo-audio';

import { useProfile } from '@/features/auth/session';
import { wordAudioUrl } from '@/features/dictionary/audio';
import { WORD_AUDIO } from '@/features/dictionary/gql';

/** Plays a dictionary word's pronunciation; null when the word has no recording. */
export function useWordAudio(
  entry: { id: string; url: string } | null | undefined,
): (() => void) | null {
  const language = useProfile().language;
  const url = entry ? wordAudioUrl(language, entry) : null;
  const player = useAudioPlayer(url ? { uri: url } : null);
  if (!url) return null;
  return () => {
    void player.seekTo(0);
    player.play();
  };
}

/** Same, for a word known only by its text (flashcards): looks the entry up first. */
export function useWordTextAudio(word: string): (() => void) | null {
  const { data } = useQuery(WORD_AUDIO, { variables: { word: word.toLocaleLowerCase('kk') } });
  return useWordAudio(data?.word);
}
