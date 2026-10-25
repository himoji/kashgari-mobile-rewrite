import type { CrosswordWord } from './crossword';

/** One screen of the player. Every exercise renderer gets one of these plus its answer. */
export type StepLabel =
  | 'reading'
  | 'listening'
  | 'cards'
  | 'mcq'
  | 'tf'
  | 'complete'
  | 'shuffle'
  | 'match'
  | 'frq'
  | 'writing'
  | 'story'
  | 'imageStory'
  | 'grammar'
  | 'grid'
  | 'crossword'
  | 'oyna';

export type Mode = 'play' | 'review';

/** A word inside a passage: `lemma` is what the dictionary looks up. */
export type PassageToken = { kind: 'text'; text: string } | { kind: 'word'; text: string; lemma: string };
export type PassageParagraph = { tokens: PassageToken[]; image?: string | null };

export type ChoiceQuestion = {
  question: string;
  options: string[];
  /** Questions generated for this student from their own words (sent back as studentQuestions). */
  student?: boolean;
  /** Known only in review (or for local grammar stories). */
  correct?: string;
};

type Base = {
  id: string;
  label: StepLabel;
  /** Overrides the shown name (e.g. a writing task shown as a short story). */
  display?: StepLabel;
  /** The activity this step belongs to (one submission per group). */
  group: string;
  /** Optional heading shown above the exercise (e.g. a passage title). */
  title?: string;
};

export type PassageStep = Base & {
  kind: 'passage';
  paragraphs: PassageParagraph[];
  audioUrl?: string | null;
  /** Words of the topic vocabulary, underlined in the text. */
  baseWords?: string[];
};
export type CardsStep = Base & { kind: 'cards'; cards: { word: string; meaning: string }[] };
export type ChoiceStep = Base & {
  kind: 'choice';
  /** Free text shown above the questions (grammar explanations). */
  intro?: PassageParagraph[];
  examples?: string[];
  prompt?: string;
  questions: ChoiceQuestion[];
};
export type MatchStep = Base & {
  kind: 'match';
  pairs: { word: string; student?: boolean; correct?: string }[];
  translations: string[];
};
export type CompleteStep = Base & {
  kind: 'complete';
  sentences: { before: string; after: string; options: string[]; correct?: string }[];
};
export type ShuffleStep = Base & { kind: 'shuffle'; items: { shuffled: string; student?: boolean; correct?: string }[] };
export type FreeTextStep = Base & {
  kind: 'text';
  prompts: { question: string; grade?: number | null }[];
  instructions?: string;
  words?: string[];
  minWords?: number;
  images?: string[];
};
export type GridStep = Base & { kind: 'grid'; rows: string[]; words: string[] };
export type CrosswordStep = Base & { kind: 'crossword'; words: CrosswordWord[] };
export type LinkStep = Base & { kind: 'link'; name: string; href: string; done?: boolean };
export type UnsupportedStep = Base & { kind: 'unsupported' };

export type Step =
  | PassageStep
  | CardsStep
  | ChoiceStep
  | MatchStep
  | CompleteStep
  | ShuffleStep
  | FreeTextStep
  | GridStep
  | CrosswordStep
  | LinkStep
  | UnsupportedStep;

/**
 * Per step: choice/complete/shuffle/text → one entry per item; match → word → translation;
 * grid → found word → "row,col,H|V"; crossword → "row,col" cell → letter.
 */
export type StepAnswer = (string | null)[] | Record<string, string>;
export type Answers = Record<string, StepAnswer | undefined>;

export type StepViewProps<S extends Step> = {
  step: S;
  answer: StepAnswer | undefined;
  onAnswer: (answer: StepAnswer) => void;
  mode: Mode;
};
