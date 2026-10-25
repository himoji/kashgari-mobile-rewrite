export type SavedWord = { word: string; meaning: string };

/**
 * The student's saved words. The API has no saved-words storage yet, so the list is empty
 * and screens show NotReady; swap this hook for a query when the backend adds it.
 */
export function useSavedWords(): { words: SavedWord[]; ready: boolean } {
  return { words: [], ready: false };
}
