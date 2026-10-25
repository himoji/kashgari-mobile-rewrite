import type { UiLanguage } from '@/features/auth/session';
import type { PlayerAssignmentFieldsFragment, PlayerSubmissionFieldsFragment, SubmissionInput } from '@/graphql/graphql';

import { asList, asMap } from '../engine/checking';
import { crosswordAnswerFromWords, crosswordLayout, crosswordSubmission } from '../engine/crossword';
import { gridAnswerFromFound, gridSubmission } from '../engine/grid';
import { parseParagraphs } from '../engine/passage';
import type { Answers, Step } from '../engine/types';

type Flashcard = PlayerAssignmentFieldsFragment['flashcards'][number];

export function meaningOf(card: Flashcard, lang: UiLanguage): string {
  const byLang = { kk: card.translationKazakh, ru: card.translationRussian, en: card.translationEnglish }[lang];
  return byLang || card.translationRussian || card.translationEnglish || card.translationKazakh || '';
}

const byText = (a: string, b: string) => a.localeCompare(b, 'kk');

/** Passage and flashcards come first, as in the design's lesson order. */
function leadingSteps(a: PlayerAssignmentFieldsFragment, group: string, lang: UiLanguage): Step[] {
  const steps: Step[] = [];
  const listening = a.__typename === 'TyndalymAssignment';
  const audioUrl = a.text.__typename === 'TyndalymText' ? a.text.audioUrl : null;
  if (a.text.paragraphs.length || (listening && audioUrl)) {
    steps.push({
      id: `${group}:passage`,
      kind: 'passage',
      label: listening ? 'listening' : 'reading',
      group,
      title: a.text.title,
      paragraphs: parseParagraphs(a.text.paragraphs),
      baseWords: a.text.baseWords,
      // With the whole class, the teacher plays the audio in the classroom.
      audioUrl: listening && a.__typename === 'TyndalymAssignment' && a.listenType === 'ALONE' ? audioUrl : null,
    });
  }
  if (a.flashcards.length) {
    steps.push({
      id: `${group}:cards`,
      kind: 'cards',
      label: 'cards',
      group,
      cards: a.flashcards.map((c) => ({ word: c.word, meaning: meaningOf(c, lang) })),
    });
  }
  return steps;
}

/** Steps a student plays for one reading/listening assignment. */
export function assignmentSteps(a: PlayerAssignmentFieldsFragment, group: string, lang: UiLanguage): Step[] {
  const g = a.games;
  const steps = leadingSteps(a, group, lang);
  if (g.wordShuffle) {
    steps.push({
      id: `${group}:shuffle`,
      kind: 'shuffle',
      label: 'shuffle',
      group,
      items: [
        ...g.wordShuffle.pairs.map((p) => ({ shuffled: p.shuffled })),
        ...g.wordShuffle.studentPairs.map((p) => ({ shuffled: p.shuffled, student: true })),
      ],
    });
  }
  if (g.completeV2?.sentences.length) {
    steps.push({
      id: `${group}:complete`,
      kind: 'complete',
      label: 'complete',
      group,
      sentences: g.completeV2.sentences.map((s) => ({ before: s.before, after: s.after, options: s.wordGroup })),
    });
  }
  if (g.wordMatch?.pairs.length) {
    steps.push({
      id: `${group}:match`,
      kind: 'match',
      label: 'match',
      group,
      pairs: g.wordMatch.pairs.map((p) => ({ word: p.word, student: p.isStudentQ })),
      translations: g.wordMatch.pairs.map((p) => p.translation),
    });
  }
  if (g.multipleChoice) {
    steps.push({
      id: `${group}:mcq`,
      kind: 'choice',
      label: 'mcq',
      group,
      questions: [
        ...g.multipleChoice.questions.map((q) => ({ question: q.question, options: q.options })),
        ...g.multipleChoice.studentQuestions.map((q) => ({ question: q.question, options: q.options, student: true })),
      ],
    });
  }
  if (g.trueFalse) {
    steps.push({
      id: `${group}:tf`,
      kind: 'choice',
      label: 'tf',
      group,
      questions: [
        ...g.trueFalse.questions.map((q) => ({ question: q.question, options: ['true', 'false'] })),
        ...g.trueFalse.studentQuestions.map((q) => ({ question: q.question, options: ['true', 'false'], student: true })),
      ],
    });
  }
  if (g.wordGrid?.words.length && g.wordGrid.rows.length) {
    steps.push({ id: `${group}:grid`, kind: 'grid', label: 'grid', group, rows: g.wordGrid.rows, words: g.wordGrid.words });
  }
  if (g.crossword?.words.length) {
    steps.push({
      id: `${group}:crossword`,
      kind: 'crossword',
      label: 'crossword',
      group,
      words: g.crossword.words.map((w) => ({ row: w.row, col: w.col, direction: w.direction, clue: w.clue, length: w.length })),
    });
  }
  if (g.freeResponse?.questions.length) {
    steps.push({
      id: `${group}:frq`,
      kind: 'text',
      label: 'frq',
      group,
      prompts: g.freeResponse.questions.map((q) => ({ question: q.question })),
    });
  }
  return steps.filter((s) => s.kind !== 'choice' || s.questions.length > 0).filter((s) => s.kind !== 'shuffle' || s.items.length > 0);
}

/** The answers of one assignment's steps, in the shape `submitAssignment` expects. Unanswered items are left out. */
export function buildSubmission(steps: Step[], answers: Answers): SubmissionInput {
  const input: SubmissionInput = {};
  for (const step of steps) {
    const list = asList(answers[step.id]);
    const at = (i: number) => (list[i] ?? '').trim();
    switch (step.label) {
      case 'mcq': {
        if (step.kind !== 'choice') break;
        const rows = step.questions.map((q, i) => ({ q, answer: at(i) })).filter((r) => r.answer);
        input.multipleChoice = {
          questions: rows.filter((r) => !r.q.student).map((r) => ({ question: r.q.question, answer: r.answer })),
          studentQuestions: rows.filter((r) => r.q.student).map((r) => ({ question: r.q.question, answer: r.answer })),
        };
        break;
      }
      case 'tf': {
        if (step.kind !== 'choice') break;
        const rows = step.questions.map((q, i) => ({ q, answer: at(i) })).filter((r) => r.answer);
        input.trueFalse = {
          questions: rows.filter((r) => !r.q.student).map((r) => ({ question: r.q.question, answer: r.answer === 'true' })),
          studentQuestions: rows.filter((r) => r.q.student).map((r) => ({ question: r.q.question, answer: r.answer === 'true' })),
        };
        break;
      }
      case 'complete':
        if (step.kind !== 'complete') break;
        input.completeV2 = {
          sentences: step.sentences
            .map((s, i) => ({ before: s.before, after: s.after, word: at(i) }))
            .filter((s) => s.word),
        };
        break;
      case 'shuffle': {
        if (step.kind !== 'shuffle') break;
        const rows = step.items.map((item, i) => ({ item, word: at(i) })).filter((r) => r.word);
        input.wordShuffle = {
          pairs: rows.filter((r) => !r.item.student).map((r) => ({ shuffled: r.item.shuffled, word: r.word })),
          studentPairs: rows.filter((r) => r.item.student).map((r) => ({ shuffled: r.item.shuffled, word: r.word })),
        };
        break;
      }
      case 'match': {
        if (step.kind !== 'match') break;
        const map = asMap(answers[step.id]);
        input.wordMatch = {
          pairs: step.pairs
            .filter((p) => map[p.word])
            .map((p) => ({ word: p.word, translation: map[p.word]!, isStudentQ: !!p.student })),
        };
        break;
      }
      case 'grid': {
        if (step.kind !== 'grid') break;
        const words = gridSubmission(step.words, asMap(answers[step.id]));
        if (words.length) input.wordGrid = { words };
        break;
      }
      case 'crossword': {
        if (step.kind !== 'crossword') break;
        const words = crosswordSubmission(crosswordLayout(step.words), asMap(answers[step.id]));
        if (words.length) input.crossword = { words };
        break;
      }
      case 'frq':
        if (step.kind !== 'text') break;
        input.freeResponse = {
          questions: step.prompts.map((p, i) => ({ question: p.question, answer: at(i) })).filter((q) => q.answer),
        };
        break;
    }
  }
  return input;
}

export type Score = { correct: number; total: number; pending: boolean };

/** Auto-checked games give correct/total; open answers wait for the teacher's grade. */
export function scoreSubmission(s: PlayerSubmissionFieldsFragment): Score {
  const games = [s.wordShuffle, s.wordMatch, s.completeV2, s.trueFalse, s.multipleChoice, s.wordGrid, s.crossword];
  let correct = 0;
  let total = 0;
  for (const g of games) {
    if (!g) continue;
    correct += g.correct;
    total += g.total;
  }
  const pending = !!s.freeResponse?.questions.some((q) => (q.answer ?? '').trim() && q.grade == null);
  return { correct, total, pending };
}

export const percent = ({ correct, total }: Score) => (total ? Math.round((correct / total) * 100) : null);

/** The played steps rebuilt from a submission, with the student's answers and the right ones. */
export function reviewSteps(
  a: PlayerAssignmentFieldsFragment,
  s: PlayerSubmissionFieldsFragment,
  group: string,
  lang: UiLanguage,
): { steps: Step[]; answers: Answers } {
  const steps: Step[] = leadingSteps(a, group, lang);
  const answers: Answers = {};
  const add = (step: Step, answer: Answers[string]) => {
    steps.push(step);
    answers[step.id] = answer;
  };

  if (s.wordShuffle) {
    const rows = [...s.wordShuffle.pairs, ...s.wordShuffle.studentPairs.map((p) => ({ ...p, student: true }))];
    add(
      {
        id: `${group}:shuffle`,
        kind: 'shuffle',
        label: 'shuffle',
        group,
        items: rows.map((r) => ({ shuffled: r.question.shuffled, correct: r.question.word ?? undefined, student: 'student' in r })),
      },
      rows.map((r) => r.answer),
    );
  }
  if (s.completeV2?.sentences.length) {
    add(
      {
        id: `${group}:complete`,
        kind: 'complete',
        label: 'complete',
        group,
        sentences: s.completeV2.sentences.map((r) => ({
          before: r.question.before,
          after: r.question.after,
          options: [...r.question.wordGroup].sort(byText),
          correct: r.question.wordGroup[0],
        })),
      },
      s.completeV2.sentences.map((r) => r.answer),
    );
  }
  if (s.wordMatch?.pairs.length) {
    const pairs = s.wordMatch.pairs;
    add(
      {
        id: `${group}:match`,
        kind: 'match',
        label: 'match',
        group,
        pairs: pairs.map((p) => ({ word: p.question.word, student: p.question.isStudentQ, correct: p.question.translation })),
        translations: pairs.map((p) => p.question.translation).sort(byText),
      },
      Object.fromEntries(pairs.filter((p) => p.answer).map((p) => [p.question.word, p.answer!])),
    );
  }
  if (s.multipleChoice) {
    const rows = [...s.multipleChoice.questions, ...s.multipleChoice.studentQuestions];
    if (rows.length)
      add(
        {
          id: `${group}:mcq`,
          kind: 'choice',
          label: 'mcq',
          group,
          questions: rows.map((r) => ({
            question: r.question.question,
            options: [...r.question.options].sort(byText),
            correct: r.question.options[0],
          })),
        },
        rows.map((r) => r.answer),
      );
  }
  if (s.trueFalse) {
    const rows = [...s.trueFalse.questions, ...s.trueFalse.studentQuestions];
    if (rows.length)
      add(
        {
          id: `${group}:tf`,
          kind: 'choice',
          label: 'tf',
          group,
          questions: rows.map((r) => ({
            question: r.question.question,
            options: ['true', 'false'],
            correct: r.question.answer == null ? undefined : String(r.question.answer),
          })),
        },
        rows.map((r) => (r.answer == null ? null : String(r.answer))),
      );
  }
  if (s.wordGrid?.question.words.length) {
    const { rows, words } = s.wordGrid.question;
    add({ id: `${group}:grid`, kind: 'grid', label: 'grid', group, rows, words }, gridAnswerFromFound(rows, s.wordGrid.answers ?? []));
  }
  if (s.crossword?.words.length) {
    const words = s.crossword.words.map((r) => ({
      row: r.question.row,
      col: r.question.col,
      direction: r.question.direction,
      clue: r.question.clue,
      length: r.question.length,
      word: r.question.word,
    }));
    add(
      { id: `${group}:crossword`, kind: 'crossword', label: 'crossword', group, words },
      crosswordAnswerFromWords(
        crosswordLayout(words),
        s.crossword.words.map((r) => r.answer),
      ),
    );
  }
  if (s.freeResponse?.questions.length) {
    add(
      {
        id: `${group}:frq`,
        kind: 'text',
        label: 'frq',
        group,
        prompts: s.freeResponse.questions.map((q) => ({ question: q.question.question, grade: q.grade })),
      },
      s.freeResponse.questions.map((q) => q.answer),
    );
  }
  return { steps, answers };
}
