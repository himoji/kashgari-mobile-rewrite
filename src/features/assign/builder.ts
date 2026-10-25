import type { AssignGamesQuery, GamesInput } from '@/graphql/graphql';
import type { MaterialRef } from '@/features/materials/material-ref';

export type Games = AssignGamesQuery['generateGames'];

/** Block types from the design's "Қосу" sheet, plus the grammar set a grammar material brings. */
export type BlockType =
  | 'reading'
  | 'listening'
  | 'grammar'
  | 'mcq'
  | 'tf'
  | 'frq'
  | 'complete'
  | 'cards'
  | 'match'
  | 'shuffle'
  | 'grid'
  | 'crossword'
  | 'wordle'
  | 'writing'
  | 'ministory';

export const BLOCK_GROUPS: { key: 'questions' | 'text' | 'games'; types: BlockType[] }[] = [
  { key: 'questions', types: ['mcq', 'tf', 'frq', 'complete'] },
  { key: 'text', types: ['reading', 'listening'] },
  { key: 'games', types: ['cards', 'match', 'shuffle', 'grid', 'crossword', 'wordle', 'writing', 'ministory'] },
];

/**
 * An assignment in the API is one text plus exercises generated from it. These picker types are separate
 * API entities (or need an audio upload), so the builder cannot add them to an assignment.
 */
export const NOT_SUPPORTED: BlockType[] = ['listening', 'wordle', 'writing', 'ministory'];

export type Block = { key: string; type: BlockType; title: string };
export type Source = { ref: MaterialRef; title: string };

/** Exercise blocks built from the generated games. */
const GAME_TYPES: BlockType[] = ['mcq', 'tf', 'frq', 'complete', 'match', 'shuffle', 'grid', 'crossword'];
export const isGameBlock = (type: BlockType) => GAME_TYPES.includes(type);

/** Does the generated set have content for this block? Flashcards need only the text's words. */
export function hasGame(type: BlockType, games: Games | null | undefined): boolean {
  if (type === 'cards') return true;
  if (!games) return false;
  switch (type) {
    case 'mcq':
      return !!games.multipleChoice?.questions.length;
    case 'tf':
      return !!games.trueFalse?.questions.length;
    case 'frq':
      return !!games.freeResponse?.questions.length;
    case 'complete':
      return !!games.completeV2?.sentences.length;
    case 'match':
      return !!games.wordMatch?.pairs.length;
    case 'shuffle':
      return !!games.wordShuffle?.pairs.length;
    case 'grid':
      return !!games.wordGrid?.words.length;
    case 'crossword':
      return !!games.crossword?.words.length;
    default:
      return false;
  }
}

/** The block's headline: the first generated question, as the design shows. */
export function blockTitle(type: BlockType, games: Games | null | undefined, label: string): string {
  const first =
    type === 'mcq'
      ? games?.multipleChoice?.questions[0]?.question
      : type === 'tf'
        ? games?.trueFalse?.questions[0]?.question
        : type === 'frq'
          ? games?.freeResponse?.questions[0]?.question
          : type === 'complete'
            ? (() => {
                const s = games?.completeV2?.sentences[0];
                return s ? `${s.before} … ${s.after}`.trim() : undefined;
              })()
            : undefined;
  return first || label;
}

let seq = 0;
export const blockKey = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

/** What a ready-made material brings: its text, flashcards and the generated questions (like the design). */
export function blocksFromSource(source: Source, games: Games | null | undefined, label: (t: BlockType) => string): Block[] {
  if (source.ref.kind === 'grammar') return [{ key: blockKey(), type: 'grammar', title: source.title }];
  const text: Block = { key: blockKey(), type: source.ref.kind === 'tyndalym' ? 'listening' : 'reading', title: source.title };
  const extra = (['cards', 'mcq', 'tf', 'frq'] as BlockType[])
    .filter((t) => hasGame(t, games))
    .map((type) => ({ key: blockKey(), type, title: blockTitle(type, games, label(type)) }));
  return [text, ...extra];
}

const stripLetter = (option: string) => option.replace(/^[A-DА-Г][.)]\s*/, '').trim();

/** GamesInput for the chosen blocks, copied from what generateGames returned. */
export function gamesInput(blocks: Block[], games: Games | null | undefined): GamesInput {
  const types = new Set(blocks.map((b) => b.type));
  const input: GamesInput = {};
  if (!games) return input;
  if (types.has('mcq') && games.multipleChoice)
    input.multipleChoice = { questions: games.multipleChoice.questions.map((q) => ({ question: q.question, options: q.options.map(stripLetter) })) };
  if (types.has('tf') && games.trueFalse)
    input.trueFalse = { questions: games.trueFalse.questions.map((q) => ({ question: q.question, answer: q.answer ?? false })) };
  if (types.has('frq') && games.freeResponse) input.freeResponse = { questions: games.freeResponse.questions.map((q) => ({ question: q.question })) };
  if (types.has('complete') && games.completeV2)
    input.completeV2 = { sentences: games.completeV2.sentences.map(({ before, after, wordGroup }) => ({ before, after, wordGroup })) };
  if (types.has('match') && games.wordMatch) input.wordMatch = { pairs: games.wordMatch.pairs.map(({ word, translation }) => ({ word, translation })) };
  if (types.has('shuffle') && games.wordShuffle)
    input.wordShuffle = { pairs: games.wordShuffle.pairs.filter((p) => p.word).map((p) => ({ word: p.word!, shuffled: p.shuffled })) };
  if (types.has('grid') && games.wordGrid) input.wordGrid = { rows: games.wordGrid.rows, words: games.wordGrid.words };
  if (types.has('crossword') && games.crossword)
    input.crossword = {
      words: games.crossword.words.filter((w) => w.word).map(({ row, col, direction, clue, word }) => ({ row, col, direction, clue, word: word! })),
    };
  return input;
}

export type ContentError = 'name' | 'content' | null;

export function contentError(name: string, source: Source | null, blocks: Block[]): ContentError {
  if (!name.trim()) return 'name';
  if (!source || !blocks.length) return 'content';
  return null;
}

/** ISO date (yyyy-mm-dd) in local time. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The API's deadline is a unix timestamp in seconds; a chosen day lasts until 23:59:59 local time. */
export function deadlineSeconds(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(new Date(y!, m! - 1, d!, 23, 59, 59).getTime() / 1000);
}

/** The next `count` days starting tomorrow, for the deadline picker. */
export function upcomingDays(from: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => isoDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i + 1)));
}

/** "31 қазан, сенбі": month and weekday names come from the locale files (Intl has no Kazakh on every engine). */
export function formatDay(iso: string, months: string[], weekdays: string[], monthFirst = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  const month = months[date.getMonth()] ?? '';
  return `${monthFirst ? `${month} ${d}` : `${d} ${month}`}, ${weekdays[date.getDay()] ?? ''}`;
}
