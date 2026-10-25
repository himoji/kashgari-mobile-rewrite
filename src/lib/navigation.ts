import { router, type Href } from 'expo-router';

/** Goes back, or to `fallback` when the screen was opened directly (a link or a reload). */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
