import { Image } from 'expo-image';
import { useEffect } from 'react';

/**
 * Downloads remote pictures into expo-image's memory and disk cache as soon as a screen has their
 * URLs, so a card or option shows its picture the moment it appears instead of loading then.
 */
export function usePrefetchImages(urls: readonly (string | null | undefined)[]) {
  const key = urls.filter(Boolean).join('\n');
  useEffect(() => {
    if (key) Image.prefetch(key.split('\n'), 'memory-disk').catch(() => false);
  }, [key]);
}
