import { useAudioPlayer } from 'expo-audio';

import { useProfile } from '@/features/auth/session';
import { wordAudioUrl } from '@/features/dictionary/audio';

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
