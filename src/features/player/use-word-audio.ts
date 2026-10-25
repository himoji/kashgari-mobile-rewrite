import { useApolloClient } from '@apollo/client/react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';

import { PlayerWordAudioQuery } from './gql';

/** Plays a word's recorded pronunciation from the dictionary. */
export function useWordAudio() {
  const client = useApolloClient();
  const player = useRef<AudioPlayer | null>(null);
  useEffect(() => () => player.current?.remove(), []);
  return useCallback(
    async (word: string) => {
      const { data } = await client.query({ query: PlayerWordAudioQuery, variables: { word: word.toLocaleLowerCase('kk') } });
      const url = data?.word?.url;
      if (!url) return;
      player.current?.remove();
      player.current = createAudioPlayer(url);
      player.current.play();
    },
    [client],
  );
}
