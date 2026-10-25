import { gql } from '@/graphql';

// ---- Word game ----

/** Asked first: loading the game itself restarts the captcha drill, so it must not run on a finished game. */
export const OYNA_WORD_GAME_STATUS = gql(`
  query OynaWordGameStatus($id: ID!, $studentId: ID!) {
    wordGameGame(id: $id) {
      id
      name
      submission(studentId: $studentId) { id time }
    }
  }
`);

export const OYNA_WORD_GAME = gql(`
  query OynaWordGame($id: ID!, $studentId: ID!) {
    wordGameGame(id: $id) {
      id
      name
      topicName
      onScreenNum
      words { word translation imageUrl(size: W256) }
      recognize {
        shuffle { pairs { shuffled word } }
        complete { pairs { word unfinished letters } }
        tiles { tiles { word correct } }
        grid { rows words }
      }
      drill {
        captcha(studentId: $studentId, restart: true) { clouds { word } }
        match { word translation }
        mcq { options { word translation imageUrl(size: W256) } }
      }
    }
  }
`);

export const OYNA_WORD_GAME_CAPTCHA_SUBMIT = gql(`
  mutation OynaWordGameCaptchaSubmit($gameId: ID!, $studentId: ID!, $word: String!) {
    wordGameCaptchaCloudSubmit(gameId: $gameId, studentId: $studentId, data: { word: $word }) {
      correct
      left
      newCloud { word }
    }
  }
`);

export const OYNA_WORD_GAME_SUBMIT = gql(`
  mutation OynaWordGameSubmit($gameId: ID!, $studentId: ID!, $data: OynaSubmissionWordGameInput!) {
    wordGameSubmit(gameId: $gameId, studentId: $studentId, data: $data) { id time points }
  }
`);

export const OYNA_WORD_GAME_RESULT = gql(`
  query OynaWordGameResult($id: ID!, $studentId: ID!) {
    wordGameGame(id: $id) {
      id
      name
      topicName
      maxPoints
      submission(studentId: $studentId) {
        id
        time
        points
        match { question { word translation } answer }
        mcq { question { options { word translation imageUrl(size: W256) } } answer }
        captcha { correctWords studentWords }
      }
    }
  }
`);

/** Pronunciation for flashcards: the dictionary entry's id and slug build the kashgari.kz audio URL. */
export const OYNA_WORD_AUDIO = gql(`
  query OynaWordAudio($word: String!) {
    word(wordCyrillic: $word) { id url }
  }
`);

// ---- Wordle ----

export const OYNA_WORDLE_GAME = gql(`
  query OynaWordleGame($id: ID!, $studentId: ID!) {
    wordleGame(id: $id) {
      id
      name
      duration
      words
      submission(studentId: $studentId) { id }
    }
  }
`);

export const OYNA_WORDLE_CHECK = gql(`
  query OynaWordleCheck($word: String!) {
    wordleCheckWord(word: $word)
  }
`);

export const OYNA_WORDLE_SUBMIT = gql(`
  mutation OynaWordleSubmit($gameId: ID!, $studentId: ID!, $data: OynaSubmissionWordleInput!) {
    wordleSubmit(gameId: $gameId, studentId: $studentId, data: $data) { id }
  }
`);

export const OYNA_WORDLE_RESULT = gql(`
  query OynaWordleResult($id: ID!, $studentId: ID!) {
    wordleGame(id: $id) {
      id
      name
      words
      maxPoints
      submission(studentId: $studentId) { id time points guesses }
      submissions { id time points student { id name } }
    }
  }
`);

// ---- Quizlet ----

export const OYNA_QUIZLET_GAME = gql(`
  query OynaQuizletGame($id: ID!, $studentId: ID!) {
    quizletGame(id: $id) {
      id
      name
      duration
      dataType
      boards { word translation imageUrl(size: W256) }
      submission(studentId: $studentId) { id }
    }
  }
`);

export const OYNA_QUIZLET_SUBMIT = gql(`
  mutation OynaQuizletSubmit($gameId: ID!, $studentId: ID!, $data: OynaSubmissionQuizletInput!) {
    quizletSubmit(gameId: $gameId, studentId: $studentId, data: $data) { id }
  }
`);

export const OYNA_QUIZLET_RESULT = gql(`
  query OynaQuizletResult($id: ID!, $studentId: ID!) {
    quizletGame(id: $id) {
      id
      name
      maxPoints
      boards { word translation }
      submission(studentId: $studentId) { id time points guessed }
      submissions { id time points student { id name } }
    }
  }
`);

// ---- Mini story ----

export const OYNA_MINI_STORY_GAME = gql(`
  query OynaMiniStoryGame($id: ID!, $studentId: ID!) {
    miniStoryGame(id: $id) {
      id
      name
      duration
      words
      submission(studentId: $studentId) { id }
    }
  }
`);

export const OYNA_MINI_STORY_SUBMIT = gql(`
  mutation OynaMiniStorySubmit($gameId: ID!, $studentId: ID!, $data: OynaSubmissionMiniStoryInput!) {
    miniStorySubmit(gameId: $gameId, studentId: $studentId, data: $data) { id }
  }
`);

export const OYNA_MINI_STORY_RESULT = gql(`
  query OynaMiniStoryResult($id: ID!, $studentId: ID!) {
    miniStoryGame(id: $id) {
      id
      name
      words
      maxPoints
      submission(studentId: $studentId) { id time points text }
    }
  }
`);
