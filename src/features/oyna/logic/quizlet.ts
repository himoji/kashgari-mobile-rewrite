export interface QuizletCard {
  word: string;
  translation?: string | null;
  imageUrl?: string | null;
}

/** Boards with empty slots and duplicate words removed (the API rejects duplicates in `guessed`). */
export function cleanBoards(boards: readonly (readonly (QuizletCard | null | undefined)[])[]): QuizletCard[][] {
  return boards.map((board) => {
    const seen = new Set<string>();
    return board.filter((c): c is QuizletCard => {
      if (!c?.word || seen.has(c.word)) return false;
      seen.add(c.word);
      return true;
    });
  });
}

/** `guessed` for `quizletSubmit`: one list per board (empty for boards not reached). */
export const guessedPayload = (boardCount: number, matched: readonly (readonly string[] | undefined)[]) =>
  Array.from({ length: boardCount }, (_, i) => [...new Set(matched[i] ?? [])]);

/** The old app kept quizlet timers between 20 s and 8 min. */
export const quizletSeconds = (duration: number) => Math.min(Math.max(duration, 20), 480);
