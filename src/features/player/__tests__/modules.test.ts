import { assignment, durys, submission, zhazylym } from '@/dev/mocks/_player-fixtures';
import type { PlayerAssignmentFieldsFragment, PlayerDurysFieldsFragment, PlayerLessonQuery, PlayerSubmissionFieldsFragment, PlayerZhazylymFieldsFragment } from '@/graphql/graphql';

import type { Answers, Step } from '../engine/types';
import { assignmentSteps, buildSubmission, meaningOf, percent, reviewSteps, scoreSubmission } from '../modules/assignment';
import { lessonActivities, zhazylymStep } from '../modules/activities';
import { durysSteps, parseCanvas } from '../modules/durys';

const a8 = assignment('a8') as unknown as PlayerAssignmentFieldsFragment;
const a1 = assignment('a1') as unknown as PlayerAssignmentFieldsFragment;
const listening = assignment('a2') as unknown as PlayerAssignmentFieldsFragment;

describe('assignmentSteps', () => {
  it('puts the passage and cards first, then one step per game', () => {
    expect(assignmentSteps(a8, 'a', 'ru').map((s) => s.label)).toEqual(['reading', 'cards', 'shuffle', 'complete', 'match', 'mcq', 'tf', 'frq']);
  });

  it('uses the definition language for card meanings', () => {
    const cards = assignmentSteps(a1, 'a', 'en').find((s) => s.kind === 'cards');
    expect(cards?.kind === 'cards' && cards.cards[0]).toEqual({ word: 'табиғат', meaning: 'nature' });
    expect(meaningOf({ word: 'x', translationKazakh: null, translationRussian: 'ру', translationEnglish: null }, 'kk')).toBe('ру');
  });

  it('gives listening alone the audio', () => {
    const passage = assignmentSteps(listening, 'a', 'ru')[0];
    expect(passage?.kind === 'passage' && passage.label).toBe('listening');
    expect(passage?.kind === 'passage' && passage.audioUrl).toContain('city.mp3');
  });

  it('keeps student-generated questions apart', () => {
    const custom = {
      ...a1,
      games: { ...a1.games, trueFalse: { questions: [{ question: 'q1' }], studentQuestions: [{ question: 'mine' }] } },
    } as PlayerAssignmentFieldsFragment;
    const tf = assignmentSteps(custom, 'a', 'ru').find((s) => s.label === 'tf');
    expect(tf?.kind === 'choice' && tf.questions.map((q) => !!q.student)).toEqual([false, true]);
  });
});

describe('buildSubmission', () => {
  const steps = assignmentSteps(a8, 'a', 'ru');
  const answers: Answers = {
    'a:shuffle': ['табиғат'],
    'a:complete': ['біздің'],
    'a:match': { табиғат: 'природа', орман: 'лес' },
    'a:mcq': ['Ағаштар қалың өсетін жер.'],
    'a:tf': ['false'],
    'a:frq': [' Табиғат әдемі. '],
  };

  it('maps every game into the SubmissionInput shape', () => {
    expect(buildSubmission(steps, answers)).toEqual({
      wordShuffle: { pairs: [{ shuffled: 'ТАҒИБАТ', word: 'табиғат' }], studentPairs: [] },
      completeV2: { sentences: [{ before: 'Табиғат —', after: 'ортақ үйіміз.', word: 'біздің' }] },
      wordMatch: {
        pairs: [
          { word: 'табиғат', translation: 'природа', isStudentQ: false },
          { word: 'орман', translation: 'лес', isStudentQ: false },
        ],
      },
      multipleChoice: { questions: [{ question: '«Орман» сөзінің мағынасын таңдаңыз.', answer: 'Ағаштар қалың өсетін жер.' }], studentQuestions: [] },
      trueFalse: { questions: [{ question: 'Өзен — арнасымен ағатын табиғи су ағыны.', answer: false }], studentQuestions: [] },
      freeResponse: { questions: [{ question: 'Табиғат туралы бір сөйлем жазыңыз.', answer: 'Табиғат әдемі.' }] },
    });
  });

  it('leaves unanswered items out', () => {
    expect(buildSubmission(steps, {}).multipleChoice).toEqual({ questions: [], studentQuestions: [] });
  });
});

describe('scores and review', () => {
  const graded = submission('a9', false) as unknown as PlayerSubmissionFieldsFragment;
  const waiting = submission('a1', true) as unknown as PlayerSubmissionFieldsFragment;

  it('adds up auto-checked games and waits for open answers', () => {
    expect(scoreSubmission(graded)).toEqual({ correct: 4, total: 5, pending: false });
    expect(percent(scoreSubmission(graded))).toBe(80);
    expect(scoreSubmission(waiting).pending).toBe(true);
    expect(percent({ correct: 0, total: 0, pending: false })).toBeNull();
  });

  it('rebuilds steps with the right answers', () => {
    const { steps, answers } = reviewSteps(a1, graded, 'a', 'ru');
    const mcq = steps.find((s) => s.label === 'mcq');
    expect(mcq?.kind === 'choice' && mcq.questions[0]?.correct).toBe('Өзен жағасын тазалады');
    const tf = steps.find((s) => s.label === 'tf');
    expect(tf?.kind === 'choice' && tf.questions[0]?.correct).toBe('true');
    expect(answers['a:tf']).toEqual(['true']);
    expect(answers['a:match']).toEqual({ табиғат: 'природа', орман: 'река', өзен: 'лес' });
    const frq = steps.find((s) => s.label === 'frq');
    expect(frq?.kind === 'text' && frq.prompts[0]?.grade).toBe(9);
  });
});

describe('durys stories', () => {
  const d = durys('a4') as unknown as PlayerDurysFieldsFragment;

  it('reads positioned components in reading order', () => {
    const tags = parseCanvas(d.durysTitle.xmls[0]!).map((c) => c.tag);
    expect(tags).toEqual(['text', 'clickable-button', 'clickable-button', 'clickable-button', 'text', 'clickable-button-block']);
  });

  it('turns a page into explanation, examples and a single-choice question', () => {
    const [page] = durysSteps(d.durysTitle.xmls, 'd');
    expect(page?.examples).toEqual(['менің досым', 'сенің мектебің', 'оның бақшасы']);
    expect(page?.intro).toHaveLength(1);
    expect(page?.questions).toEqual([{ question: '«Менің ...» тіркесін толықтырыңыз.', options: ['досым', 'досың', 'досы'], correct: 'досым' }]);
  });

  it('reads sentence games and survives broken props', () => {
    const xml = `<canvas><components>
<sentence-game><id>s</id><position x="0" y="10" z="1" /><props><![CDATA[{"sentenceGame":{"title":"Толықтыр","sentences":[{"sentence":"Мен ___ барамын","correctWord":"мектепке"},{"sentence":"Ол ___ келді","correctWord":"үйден"}]}}]]></props></sentence-game>
<text><id>t</id><position x="0" y="0" z="1" /><props><![CDATA[{broken]]></props></text>
</components></canvas>`;
    const [page] = durysSteps([xml], 'd');
    expect(page?.prompt).toBe('Толықтыр');
    expect(page?.questions.map((q) => q.correct)).toEqual(['мектепке', 'үйден']);
    expect(page?.questions[0]?.options).toEqual(['мектепке', 'үйден']);
    expect(page?.intro).toEqual([]);
  });
});

describe('writing and lessons', () => {
  it('builds the writing step from a zhazylym', () => {
    const step = zhazylymStep(zhazylym('a5') as unknown as PlayerZhazylymFieldsFragment, 'z');
    expect(step).toMatchObject({ kind: 'text', label: 'writing', minWords: 40, words: ['табиғат', 'су', 'қорғау'] });
  });

  it('skips submitted activities and links games to the Oyna player', () => {
    const lesson = {
      id: 'l1',
      name: 'Сабақ',
      opensAt: 0,
      submission: null,
      activities: [
        { __typename: 'TextActivity', moduleName: 'Oqylym', text: { id: 't', assignment: { ...a1, submission: { id: 's' } } } },
        { __typename: 'ZhazylymActivity', zhazylym: { ...zhazylym('z1'), submission: null } },
        { __typename: 'OynaActivity', game: { __typename: 'OynaGameWordle', id: 'g1', name: 'Сөзді тап', submission: null } },
      ],
    } as unknown as NonNullable<PlayerLessonQuery['lesson']>;
    const acts = lessonActivities(lesson, 'ru');
    expect(acts.map((a) => a.kind)).toEqual(['zhazylym', 'oyna']);
    const link = acts[1]?.steps[0] as Extract<Step, { kind: 'link' }>;
    expect(link.href).toBe('/student/play/oyna/g1?game=OynaGameWordle');
    expect(acts[0]?.group).toBe('act1');
  });
});
