import { assignment, submission } from '@/dev/mocks/_player-fixtures';
import type { PlayerAssignmentFieldsFragment, PlayerSubmissionFieldsFragment } from '@/graphql/graphql';

import { isStepComplete } from '../engine/checking';
import {
  clueSenses,
  crosswordAnswerFromWords,
  crosswordCellState,
  crosswordLayout,
  crosswordSubmission,
  entryText,
  isCrosswordComplete,
  isEntryCorrect,
  normalizeLetter,
  pickEntry,
  stepCell,
  type CrosswordWord,
} from '../engine/crossword';
import {
  decodePlacement,
  encodePlacement,
  foundCells,
  gridAnswerFromFound,
  gridReviewCells,
  gridSubmission,
  locateWord,
  matchSelection,
  straightRun,
} from '../engine/grid';
import type { Step } from '../engine/types';
import { assignmentSteps, buildSubmission, reviewSteps } from '../modules/assignment';

const rows = ['АЛМАКЕТ', 'РНЫЗШҮО', 'ЕДЖҰЛҒС', 'ӨАҒАШБА', 'БГІҚЕРП', 'АХҢУӨЗН', 'ҚЫТАТАМ'];
const words = ['АЛМА', 'АҒАШ', 'ТОСАП', 'БАҚ', 'АТАМ'];
const cells = (...pairs: [number, number][]) => pairs.map(([row, col]) => ({ row, col }));

describe('word grid', () => {
  it('locates words across and down', () => {
    expect(locateWord(rows, 'АЛМА')).toEqual({ row: 0, col: 0, dir: 'H' });
    expect(locateWord(rows, 'тосап')).toEqual({ row: 0, col: 6, dir: 'V' });
    expect(locateWord(rows, 'ЖОҚ')).toBeNull();
  });

  it('accepts only unbroken straight runs', () => {
    expect(straightRun(cells([0, 2], [0, 0], [0, 1]))).toEqual(cells([0, 0], [0, 1], [0, 2]));
    expect(straightRun(cells([0, 0], [0, 2]))).toBeNull();
    expect(straightRun(cells([0, 0], [1, 1]))).toBeNull();
    expect(straightRun(cells([0, 0]))).toBeNull();
  });

  it('matches a selection in any tap order, forwards or backwards', () => {
    expect(matchSelection(rows, words, cells([0, 3], [0, 1], [0, 0], [0, 2]))).toEqual({
      word: 'АЛМА',
      placement: { row: 0, col: 0, dir: 'H' },
    });
    expect(matchSelection(rows, words, cells([4, 0], [5, 0], [6, 0]))?.word).toBe('БАҚ');
    expect(matchSelection(rows, words, cells([0, 0], [0, 1], [0, 2]))).toBeNull();
  });

  it('encodes placements and builds the submission in word order', () => {
    expect(decodePlacement(encodePlacement({ row: 3, col: 1, dir: 'H' }))).toEqual({ row: 3, col: 1, dir: 'H' });
    expect(decodePlacement('x')).toBeNull();
    const answer = { БАҚ: '4,0,V', АЛМА: '0,0,H' };
    expect(gridSubmission(words, answer)).toEqual([
      { word: 'АЛМА', row: 0, col: 0 },
      { word: 'БАҚ', row: 4, col: 0 },
    ]);
    expect(foundCells(answer)).toEqual(new Set(['0,0', '0,1', '0,2', '0,3', '4,0', '5,0', '6,0']));
  });

  it('shows found and missed words in review', () => {
    const answer = gridAnswerFromFound(rows, ['АЛМА']);
    expect(answer).toEqual({ АЛМА: '0,0,H' });
    const review = gridReviewCells(rows, words, answer);
    expect(review.get('0,0')).toBe('found');
    expect(review.get('3,1')).toBe('missed');
    expect(review.get('0,6')).toBe('missed');
    expect(review.get('1,1')).toBeUndefined();
  });
});

const xw: CrosswordWord[] = [
  { row: 2, col: 1, direction: 'HORIZONTAL', clue: 'яблоко~\\apple', length: 4, word: 'алма' },
  { row: 1, col: 1, direction: 'VERTICAL', clue: 'сад~\\garden\\~огород~\\orchard', length: 3, word: 'бақ' },
];

describe('crossword', () => {
  const layout = crosswordLayout(xw);

  it('lays out cells, numbers and the bounding box', () => {
    expect(layout.entries.map((e) => [e.number, e.cells])).toEqual([
      [2, ['2,1', '2,2', '2,3', '2,4']],
      [1, ['1,1', '2,1', '3,1']],
    ]);
    expect([layout.top, layout.left, layout.rows, layout.cols]).toEqual([1, 1, 3, 4]);
    expect(layout.cellEntries.get('2,1')).toEqual([0, 1]);
  });

  it('splits clue senses and translations', () => {
    expect(clueSenses(xw[1]!.clue)).toEqual(['сад · garden', 'огород · orchard']);
  });

  it('keeps the last typed character, lowercased', () => {
    expect(normalizeLetter('аБ')).toBe('б');
    expect(normalizeLetter(' ')).toBe('');
  });

  it('switches direction only when the focused shared cell is tapped again', () => {
    expect(pickEntry(layout, '2,1', 0, null)).toBe(0);
    expect(pickEntry(layout, '2,1', 0, '2,1')).toBe(1);
    expect(pickEntry(layout, '3,1', 0, null)).toBe(1);
    expect(stepCell(layout.entries[0]!, '2,1', 1)).toBe('2,2');
    expect(stepCell(layout.entries[0]!, '2,1', -1)).toBeNull();
  });

  it('shares crossing letters and submits words with _ for gaps', () => {
    const answer = { '2,1': 'а', '2,2': 'л', '1,1': 'б' };
    expect(entryText(layout.entries[1]!, answer)).toBe('ба_');
    expect(crosswordSubmission(layout, answer)).toEqual([
      { word: 'ал__', row: 2, col: 1, direction: 'HORIZONTAL' },
      { word: 'ба_', row: 1, col: 1, direction: 'VERTICAL' },
    ]);
    expect(crosswordSubmission(layout, {})).toEqual([]);
    expect(isCrosswordComplete(layout, answer)).toBe(false);
    expect(isCrosswordComplete(layout, { ...answer, '2,3': 'м', '2,4': 'а', '3,1': 'қ' })).toBe(true);
  });

  it('rebuilds and checks a submitted crossword', () => {
    const answer = crosswordAnswerFromWords(layout, ['АЛМЫ', 'ба_']);
    expect(answer).toEqual({ '2,1': 'а', '2,2': 'л', '2,3': 'м', '2,4': 'ы', '1,1': 'б' });
    expect(crosswordCellState(layout, answer, '2,4')).toBe('wrong');
    expect(crosswordCellState(layout, answer, '2,1')).toBe('correct');
    expect(crosswordCellState(layout, answer, '3,1')).toBe('empty');
    expect(isEntryCorrect(layout.entries[0]!, { ...answer, '2,4': 'а' })).toBe(true);
  });
});

describe('grid and crossword steps of an assignment', () => {
  const garden = assignment('a-garden') as unknown as PlayerAssignmentFieldsFragment;
  const steps = assignmentSteps(garden, 'g', 'ru');

  it('plays both games after the shuffle', () => {
    expect(steps.map((s) => s.label)).toEqual(['reading', 'cards', 'shuffle', 'grid', 'crossword']);
  });

  it('needs one found word in the grid and every crossword cell filled', () => {
    const grid = steps.find((s) => s.kind === 'grid') as Step;
    const crossword = steps.find((s) => s.kind === 'crossword') as Step;
    expect(isStepComplete(grid, {})).toBe(false);
    expect(isStepComplete(grid, { АЛМА: '0,0,H' })).toBe(true);
    expect(isStepComplete(crossword, { '2,1': 'а' })).toBe(false);
  });

  it('adds wordGrid and crossword to the submission', () => {
    const input = buildSubmission(steps, { 'g:grid': { АЛМА: '0,0,H' }, 'g:crossword': { '1,1': 'б', '2,1': 'а', '3,1': 'қ' } });
    expect(input.wordGrid).toEqual({ words: [{ word: 'АЛМА', row: 0, col: 0 }] });
    expect(input.crossword?.words).toEqual([
      { word: 'а___', row: 2, col: 1, direction: 'HORIZONTAL' },
      { word: 'бақ', row: 1, col: 1, direction: 'VERTICAL' },
    ]);
    expect(buildSubmission(steps, {}).wordGrid).toBeUndefined();
    expect(buildSubmission(steps, {}).crossword).toBeUndefined();
  });

  it('rebuilds both games from a submission for review', () => {
    const sub = submission('a-garden', false) as unknown as PlayerSubmissionFieldsFragment;
    const { steps: review, answers } = reviewSteps(garden, sub, 'g', 'ru');
    expect(review.map((s) => s.label)).toEqual(['reading', 'cards', 'grid', 'crossword']);
    expect(answers['g:grid']).toEqual({ АЛМА: '0,0,H', ТОСАП: '0,6,V' });
    expect(answers['g:crossword']).toMatchObject({ '1,1': 'б', '5,4': 'с' });
  });
});
