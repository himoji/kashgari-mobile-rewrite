// Sample work for the player and result screens, modelled on the Donatien prototype (content.js).
const DAY = 86400;
export const now = () => Math.floor(Date.now() / 1000);

const vocab: Record<string, [ru: string, en: string]> = {
  табиғат: ['природа', 'nature'],
  орман: ['лес', 'forest'],
  өзен: ['река', 'river'],
  су: ['вода', 'water'],
  қорғау: ['защищать', 'protect'],
  бақ: ['сад', 'garden'],
  алма: ['яблоко', 'apple'],
  ағаш: ['дерево', 'tree'],
  атам: ['мой дедушка', 'my grandfather'],
  тосап: ['варенье', 'jam'],
};

export const nature =
  'Табиғат — біздің ортақ үйіміз. Ол бізге таза ауа, су және азық береді. Орманда ағаштар өсіп, құстар мен жануарлар тіршілік етеді. Өзендер мен көлдер көптеген тіршілік иелерінің мекені.\n\nБіздің ауылдың жанында шағын өзен бар. Көктемде оның жағасына гүлдер өседі. Сенбі күні сыныптастарымызбен өзен жағасын тазаладық. Біз қоқысты жинап, арнайы жәшіктерге салдық. Мұғаліміміз табиғатты қорғау әр адамның міндеті екенін айтты.\n\nТабиғатты қорғау үлкен істерден ғана басталмайды. Суды үнемдеу, ағаш отырғызу және қоқысты сұрыптау да маңызды. Әрқайсымыз күн сайын бір пайдалы әрекет жасасақ, ортақ үйіміз таза әрі әдемі болады.';

const garden =
  'Атамның үлкен бағы бар. Бақта алма ағаштары өседі. Жазда мен атама көмектесемін. Біз ағаштарға су құямыз.\n\nКүзде алма піседі. Атам қызыл алманы жақсы көреді. Әжем алмадан тосап жасайды. Мен жаңа піскен алманы жегенді ұнатамын. Бақта жұмыс істеу маған қуаныш сыйлайды.';

const city =
  'Бүгін мен досыммен Алматы қаласын араладым. Таңертең біз саябаққа бардық. Саябақта биік ағаштар мен әдемі гүлдер өседі. Таза ауада серуендеп, құстардың дауысын тыңдадық.\n\nТүстен кейін кітап дүкеніне кірдік. Мен қазақ тіліндегі әңгімелер жинағын сатып алдым. Досым табиғат туралы кітап таңдады.';

/** Marks every word the way `paragraphs(withDef: true)` does: plain \~ word \~ meta. */
function marked(text: string): string {
  return text
    .split(/(\s+|[.,!?—:;«»]+)/)
    .map((part) => {
      if (!part || /^(\s+|[.,!?—:;«»]+)$/.test(part)) return part;
      const lower = part.toLocaleLowerCase('kk');
      const lemma = Object.keys(vocab).find((w) => lower.startsWith(w));
      return `\\~${part}\\~${lemma ? `${lemma}:1` : '='}\\~`;
    })
    .join('');
}

const paragraphs = (text: string, typename: 'OqylymParagraph' | 'TyndalymParagraph') =>
  text.split('\n\n').map((p) => ({ __typename: typename, text: marked(p), image: null }));

const card = (word: string) => ({
  __typename: 'Flashcard',
  word,
  translationKazakh: null,
  translationRussian: vocab[word]?.[0] ?? word,
  translationEnglish: vocab[word]?.[1] ?? word,
});

type Games = {
  shuffle?: string[];
  complete?: { before: string; after: string; wordGroup: string[] }[];
  match?: string[];
  mcq?: { question: string; options: string[] }[];
  tf?: string[];
  frq?: string[];
  grid?: { rows: string[]; words: string[] };
  crossword?: { row: number; col: number; direction: 'HORIZONTAL' | 'VERTICAL'; word: string }[];
};

/** Clue as the API builds it for a Kazakh student: ru~\\en per sense. */
const clueOf = (word: string) => (vocab[word] ? `${vocab[word][0]}~\\${vocab[word][1]}` : word);

function games(g: Games) {
  return {
    __typename: 'Games',
    wordShuffle: g.shuffle
      ? { __typename: 'GameWordShuffle', pairs: g.shuffle.map((shuffled) => ({ __typename: 'GameWordShufflePair', shuffled })), studentPairs: [] }
      : null,
    wordMatch: g.match
      ? {
          __typename: 'GameWordMatch',
          // The server shuffles the translations for students.
          pairs: g.match.map((word, i, all) => ({
            __typename: 'GameWordMatchPair',
            word,
            translation: vocab[all[(i + 1) % all.length]!]![0],
            isStudentQ: false,
          })),
        }
      : null,
    completeV2: g.complete
      ? { __typename: 'GameCompleteV2', sentences: g.complete.map((s) => ({ __typename: 'GameCompleteV2Sentence', ...s })) }
      : null,
    trueFalse: g.tf
      ? { __typename: 'GameTrueFalse', questions: g.tf.map((question) => ({ __typename: 'GameTrueFalseQuestion', question })), studentQuestions: [] }
      : null,
    multipleChoice: g.mcq
      ? {
          __typename: 'GameMultipleChoice',
          questions: g.mcq.map((q) => ({ __typename: 'GameMultipleChoiceQuestion', ...q })),
          studentQuestions: [],
        }
      : null,
    freeResponse: g.frq ? { __typename: 'GameFreeResponse', questions: g.frq.map((question) => ({ __typename: 'GameFreeResponseQuestion', question })) } : null,
    wordGrid: g.grid ? { __typename: 'GameWordGrid', ...g.grid } : null,
    crossword: g.crossword
      ? {
          __typename: 'GameCrossword',
          words: g.crossword.map(({ word, ...w }) => ({ __typename: 'GameCrosswordWord', ...w, clue: clueOf(word), length: Array.from(word).length })),
        }
      : null,
  };
}

/** The API's 7×7 word search: words go left-to-right or top-to-bottom, upper case. */
const gardenGrid = {
  rows: ['АЛМАКЕТ', 'РНЫЗШҮО', 'ЕДЖҰЛҒС', 'ӨАҒАШБА', 'БГІҚЕРП', 'АХҢУӨЗН', 'ҚЫТАТАМ'],
  words: ['АЛМА', 'АҒАШ', 'ТОСАП', 'БАҚ', 'АТАМ'],
};

const gardenCrossword: NonNullable<Games['crossword']> = [
  { row: 2, col: 1, direction: 'HORIZONTAL', word: 'алма' },
  { row: 1, col: 1, direction: 'VERTICAL', word: 'бақ' },
  { row: 2, col: 4, direction: 'VERTICAL', word: 'ағаш' },
  { row: 4, col: 4, direction: 'HORIZONTAL', word: 'атам' },
  { row: 4, col: 5, direction: 'VERTICAL', word: 'тосап' },
];

const gardenGames: Games = {
  shuffle: ['ЛАМА'],
  crossword: gardenCrossword,
  grid: gardenGrid,
};

const natureGames: Games = {
  mcq: [{ question: 'Оқушылар сенбі күні не істеді?', options: ['Өзен жағасын тазалады', 'Кітап дүкеніне барды', 'Тауда демалды'] }],
  tf: ['Табиғатты қорғау — әр адамның міндеті.'],
  match: ['табиғат', 'орман', 'өзен'],
  frq: ['Табиғатты қорғау үшін күнделікті қандай әрекет жасай аласыз?'],
};

const newWordsGames: Games = {
  shuffle: ['ТАҒИБАТ'],
  complete: [{ before: 'Табиғат —', after: 'ортақ үйіміз.', wordGroup: ['біздің', 'сіздің', 'олардың'] }],
  match: ['табиғат', 'орман', 'өзен', 'су'],
  mcq: [{ question: '«Орман» сөзінің мағынасын таңдаңыз.', options: ['Ағаштар қалың өсетін жер.', 'Сан атауы.', 'Қимыл атауы.'] }],
  tf: ['Өзен — арнасымен ағатын табиғи су ағыны.'],
  frq: ['Табиғат туралы бір сөйлем жазыңыз.'],
};

/** An Oqylym/Tyndalym assignment as PlayerAssignmentFields selects it. */
export function assignment(id: string) {
  if (id === 'a2') {
    return {
      __typename: 'TyndalymAssignment',
      id,
      name: 'Алматыдағы бір күн',
      deadline: now() + 5 * DAY,
      listenType: 'ALONE',
      flashcards: [],
      text: {
        __typename: 'TyndalymText',
        id: 't-city',
        title: 'Алматыдағы бір күн',
        baseWords: ['саяхат', 'дос', 'кітап'],
        paragraphs: paragraphs(city, 'TyndalymParagraph'),
        audioUrl: 'https://example.com/audio/city.mp3',
      },
      games: games({
        mcq: [{ question: 'Таңертең достар қайда барды?', options: ['Саябаққа', 'Мектепке', 'Әуежайға'] }],
        complete: [{ before: 'Досым табиғат туралы', after: 'таңдады.', wordGroup: ['кітап', 'қалам', 'дәптер'] }],
        tf: ['Мен қазақ тіліндегі әңгімелер жинағын сатып алдым.'],
      }),
    };
  }
  if (id === 'a-garden') {
    return {
      __typename: 'OqylymAssignment',
      id,
      name: 'Атамның бағы',
      deadline: now() + 4 * DAY,
      flashcards: ['бақ', 'алма', 'ағаш', 'тосап'].map(card),
      text: { __typename: 'OqylymText', id: 't-garden', title: 'Атамның бағы', baseWords: ['бақ', 'алма', 'су'], paragraphs: paragraphs(garden, 'OqylymParagraph') },
      games: games(gardenGames),
    };
  }
  const newWords = id === 'a8';
  return {
    __typename: 'OqylymAssignment',
    id,
    name: newWords ? 'Табиғат туралы жаңа сөздер' : 'Табиғат — біздің ортақ үйіміз',
    deadline: now() + 4 * DAY,
    flashcards: ['табиғат', 'орман', 'өзен', 'су', 'қорғау'].map(card),
    text: {
      __typename: 'OqylymText',
      id: `t-${id}`,
      title: 'Табиғат — біздің ортақ үйіміз',
      baseWords: ['табиғат', 'орман', 'өзен', 'су', 'қорғау'],
      paragraphs: paragraphs(nature, 'OqylymParagraph'),
    },
    games: games(newWords ? newWordsGames : natureGames),
  };
}

/** Durys story pages: canvas XML with positioned components. */
const component = (tag: string, x: number, y: number, props: unknown) =>
  `<${tag}>\n<id>${tag}-${x}-${y}</id>\n<position x="${x}" y="${y}" z="1" />\n<props><![CDATA[${JSON.stringify(props)}]]></props>\n</${tag}>`;

const text = (t: string, y: number, type = 'p') => component('text', 8, y, { text: { text: t, type, color: '#004d65' } });

export function durys(id: string) {
  const page1 = `<?xml version="1.0" encoding="UTF-8"?><canvas><components>
${text('Тәуелдік жалғауы заттың кімге тиесілі екенін білдіреді. Мысалы: менің кітабым, сенің кітабың, оның кітабы. Дауысты дыбысқа аяқталған сөзге және дауыссызға аяқталған сөзге жалғау әртүрлі жалғанады.', 40)}
<interact type="click">${component('clickable-button', 8, 200, { clickableWord: { text: 'менің досым', color: '#2C92B2' } })}</interact>
<interact type="click">${component('clickable-button', 120, 200, { clickableWord: { text: 'сенің мектебің', color: '#2C92B2' } })}</interact>
<interact type="click">${component('clickable-button', 8, 250, { clickableWord: { text: 'оның бақшасы', color: '#2C92B2' } })}</interact>
${text('«Менің ...» тіркесін толықтырыңыз.', 320, 'h2')}
${component('clickable-button-block', 8, 360, { clickableWordBlock: { correctWords: ['досым'], incorrectWords: ['досың', 'досы'] } })}
</components></canvas>`;
  return {
    __typename: 'DurysAssignment',
    id,
    durysTitle: { __typename: 'DurysTitle', id: `dt-${id}`, title: 'Тәуелдік жалғауы', xmls: [page1] },
  };
}

export function zhazylym(id: string) {
  if (id === 'a9' || id === 'a5') {
    return {
      __typename: 'WordZhazylym',
      id,
      name: 'Мен табиғатты қалай қорғаймын?',
      deadline: now() + 6 * DAY,
      opensAt: now() - DAY,
      minWords: 40,
      words: ['табиғат', 'су', 'қорғау'],
    };
  }
  return {
    __typename: 'WordZhazylym',
    id,
    name: id === 'z-l1' ? 'Менің табиғатқа уәдем' : id === 'a1' ? 'Табиғат — біздің ортақ үйіміз' : 'Бақтағы бір күн',
    deadline: now() + 3 * DAY,
    opensAt: now() - DAY,
    minWords: 0,
    words: id === 'z-l1' ? ['табиғат', 'қорғау', 'су'] : ['бақ', 'алма', 'су'],
  };
}

export const lessonName = (id: string) => (id === 'l1' ? 'Табиғат және адам' : 'Қаладағы саяхат');
export const lessonOpensAt = (id: string) => (id === 'l2' ? now() + 5 * DAY : now() - 3 * DAY);

// ---------- submissions (with right answers, as the API returns them) ----------

const mcqAnswer = (question: string, options: string[], answer: string | null) => ({
  __typename: 'SubmissionMultipleChoiceAnswer',
  question: { __typename: 'GameMultipleChoiceQuestion', question, options },
  answer,
});

/** "Атамның бағы": two words found in the grid, the crossword partly right. */
function gardenSubmission(id: string) {
  const typed = ['алма', 'бақ', 'ағас', null, 'тосап'];
  const crossword = gardenCrossword.map(({ word, ...w }, i) => ({
    __typename: 'SubmissionCrosswordAnswer',
    question: { __typename: 'GameCrosswordWord', ...w, word, clue: clueOf(word), length: Array.from(word).length },
    answer: typed[i] ?? null,
  }));
  return {
    __typename: 'Submission',
    id: `sub-${id}`,
    createdAt: now() - DAY,
    wordShuffle: null,
    wordMatch: null,
    completeV2: null,
    trueFalse: null,
    multipleChoice: null,
    freeResponse: null,
    wordGrid: { __typename: 'SubmissionWordGrid', total: 5, correct: 2, question: { __typename: 'GameWordGrid', ...gardenGrid }, answers: ['АЛМА', 'ТОСАП'] },
    crossword: { __typename: 'SubmissionCrossword', total: 5, correct: 3, words: crossword },
  };
}

export function submission(id: string, pending: boolean) {
  if (id === 'a-garden') return gardenSubmission(id);
  return {
    __typename: 'Submission',
    id: `sub-${id}`,
    createdAt: now() - 2 * DAY,
    wordShuffle: null,
    wordMatch: {
      __typename: 'SubmissionWordMatch',
      total: 3,
      correct: 2,
      pairs: [
        ['табиғат', 'природа', 'природа'],
        ['орман', 'лес', 'река'],
        ['өзен', 'река', 'лес'],
      ].map(([word, translation, answer]) => ({
        __typename: 'SubmissionWordMatchAnswer',
        question: { __typename: 'GameWordMatchPair', word, translation, isStudentQ: false },
        answer,
      })),
    },
    completeV2: null,
    trueFalse: {
      __typename: 'SubmissionTrueFalse',
      total: 1,
      correct: 1,
      questions: [
        {
          __typename: 'SubmissionTrueFalseAnswer',
          question: { __typename: 'GameTrueFalseQuestion', question: 'Табиғатты қорғау — әр адамның міндеті.', answer: true },
          answer: true,
        },
      ],
      studentQuestions: [],
    },
    multipleChoice: {
      __typename: 'SubmissionMultipleChoice',
      total: 1,
      correct: 1,
      questions: [mcqAnswer('Оқушылар сенбі күні не істеді?', ['Өзен жағасын тазалады', 'Кітап дүкеніне барды', 'Тауда демалды'], 'Өзен жағасын тазалады')],
      studentQuestions: [],
    },
    freeResponse: {
      __typename: 'SubmissionFreeResponse',
      total: 1,
      questions: [
        {
          __typename: 'SubmissionFreeResponseAnswer',
          question: { __typename: 'GameFreeResponseQuestion', question: 'Табиғатты қорғау үшін күнделікті қандай әрекет жасай аласыз?' },
          answer: 'Мен суды үнемдеймін және қоқысты сұрыптаймын.',
          grade: pending ? null : 9,
        },
      ],
    },
    wordGrid: null,
    crossword: null,
  };
}
