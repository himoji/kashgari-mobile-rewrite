import { gql } from '@/graphql';

/** Everything a student needs to play one reading/listening assignment (games come without answers). */
export const PlayerAssignmentFields = gql(`
  fragment PlayerAssignmentFields on Assignment {
    __typename
    id
    name
    deadline
    flashcards {
      word
      translationKazakh
      translationRussian
      translationEnglish
    }
    text {
      __typename
      id
      title
      baseWords
      paragraphs(withDef: true) {
        text
        image
      }
      ... on TyndalymText {
        audioUrl
      }
    }
    ... on TyndalymAssignment {
      listenType
    }
    games(studentId: $studentId) {
      wordShuffle(type: Student) {
        pairs { shuffled }
        studentPairs { shuffled }
      }
      wordMatch(type: Student) {
        pairs { word translation isStudentQ }
      }
      completeV2(type: Student) {
        sentences { before after wordGroup }
      }
      trueFalse(type: Student) {
        questions { question }
        studentQuestions { question }
      }
      multipleChoice(type: Student) {
        questions { question options }
        studentQuestions { question options }
      }
      freeResponse {
        questions { question }
      }
      wordGrid {
        rows
        words
      }
      crossword(type: Student) {
        words { row col direction clue length }
      }
    }
  }
`);

/** A submitted attempt with the right answers (options[0], wordGroup[0], question.word…) for review. */
export const PlayerSubmissionFields = gql(`
  fragment PlayerSubmissionFields on Submission {
    id
    createdAt
    wordShuffle {
      total
      correct
      pairs { question { shuffled word } answer }
      studentPairs { question { shuffled word } answer }
    }
    wordMatch {
      total
      correct
      pairs { question { word translation isStudentQ } answer }
    }
    completeV2 {
      total
      correct
      sentences { question { before after wordGroup } answer }
    }
    trueFalse {
      total
      correct
      questions { question { question answer } answer }
      studentQuestions { question { question answer } answer }
    }
    multipleChoice {
      total
      correct
      questions { question { question options } answer }
      studentQuestions { question { question options } answer }
    }
    freeResponse {
      total
      questions { question { question } answer grade }
    }
    wordGrid {
      total
      correct
      question { rows words }
      answers
    }
    crossword {
      total
      correct
      words { question { row col direction clue length word } answer }
    }
  }
`);

export const PlayerZhazylymFields = gql(`
  fragment PlayerZhazylymFields on Zhazylym {
    __typename
    id
    name
    deadline
    opensAt
    minWords
    ... on WordZhazylym {
      words
    }
    ... on ImageZhazylym {
      words
      imagesDownload
    }
  }
`);

export const PlayerDurysFields = gql(`
  fragment PlayerDurysFields on DurysAssignment {
    id
    durysTitle {
      id
      title
      xmls
    }
  }
`);

export const PlayerAssignmentQuery = gql(`
  query PlayerAssignment($id: ID!, $studentId: ID!) {
    assignment(id: $id) {
      ...PlayerAssignmentFields
      submission(studentId: $studentId) { id }
    }
  }
`);

export const PlayerZhazylymQuery = gql(`
  query PlayerZhazylym($id: ID!, $studentId: ID!) {
    zhazylym(id: $id) {
      ...PlayerZhazylymFields
      submission(studentId: $studentId) { id }
    }
  }
`);

export const PlayerDurysQuery = gql(`
  query PlayerDurys($id: ID!, $studentId: ID!) {
    durysAssignment(id: $id) {
      ...PlayerDurysFields
      submission(studentId: $studentId)
    }
  }
`);

/** A lesson is a sequence of activities; each one is played and submitted on its own. */
export const PlayerLessonQuery = gql(`
  query PlayerLesson($id: ID!, $studentId: ID!, $classId: ID!) {
    lesson(id: $id) {
      id
      name
      opensAt
      submission(studentId: $studentId) { createdAt }
      activities {
        __typename
        ... on TextActivity {
          moduleName
          text {
            id
            assignment(classId: $classId) {
              ...PlayerAssignmentFields
              submission(studentId: $studentId) { id }
            }
          }
        }
        ... on ZhazylymActivity {
          zhazylym {
            ...PlayerZhazylymFields
            submission(studentId: $studentId) { id }
          }
        }
        ... on DurysActivity {
          assignment {
            ...PlayerDurysFields
            submission(studentId: $studentId)
          }
        }
        ... on OynaActivity {
          game {
            __typename
            id
            name
            submission(studentId: $studentId) { id }
          }
        }
      }
    }
  }
`);

export const PlayerStudentClassQuery = gql(`
  query PlayerStudentClass($studentId: ID!) {
    student(id: $studentId) {
      id
      class { id }
    }
  }
`);

export const PlayerSubmitAssignment = gql(`
  mutation PlayerSubmitAssignment($assignmentId: ID!, $studentId: ID!, $answers: SubmissionInput!, $stats: SubmissionStatsInput) {
    submitAssignment(assignmentId: $assignmentId, studentId: $studentId, answers: $answers, stats: $stats) { id }
  }
`);

export const PlayerSubmitZhazylym = gql(`
  mutation PlayerSubmitZhazylym($zhazylymId: ID!, $studentId: ID!, $data: ZhazylymSubmissionInput!) {
    submitZhazylym(zhazylymId: $zhazylymId, studentId: $studentId, data: $data) { id }
  }
`);

export const PlayerSubmitDurys = gql(`
  mutation PlayerSubmitDurys($durysAssignmentId: ID!, $studentId: ID!) {
    submitDurysAssignment(durysAssignmentId: $durysAssignmentId, studentId: $studentId) { id }
  }
`);

// ---------- results ----------

export const ResultAssignmentQuery = gql(`
  query ResultAssignment($id: ID!, $studentId: ID!) {
    assignment(id: $id) {
      ...PlayerAssignmentFields
      submission(studentId: $studentId) { ...PlayerSubmissionFields }
    }
  }
`);

export const ResultZhazylymQuery = gql(`
  query ResultZhazylym($id: ID!, $studentId: ID!) {
    zhazylym(id: $id) {
      ...PlayerZhazylymFields
      submission(studentId: $studentId) { id createdAt text points }
    }
  }
`);

export const ResultDurysQuery = gql(`
  query ResultDurys($id: ID!, $studentId: ID!) {
    durysAssignment(id: $id) {
      ...PlayerDurysFields
      submission(studentId: $studentId)
    }
  }
`);

export const ResultLessonQuery = gql(`
  query ResultLesson($id: ID!, $studentId: ID!, $classId: ID!) {
    lesson(id: $id) {
      id
      name
      opensAt
      submission(studentId: $studentId) { createdAt }
      activities {
        __typename
        ... on TextActivity {
          moduleName
          text {
            id
            assignment(classId: $classId) {
              ...PlayerAssignmentFields
              submission(studentId: $studentId) { ...PlayerSubmissionFields }
            }
          }
        }
        ... on ZhazylymActivity {
          zhazylym {
            ...PlayerZhazylymFields
            submission(studentId: $studentId) { id createdAt text points }
          }
        }
        ... on DurysActivity {
          assignment {
            ...PlayerDurysFields
            submission(studentId: $studentId)
          }
        }
        ... on OynaActivity {
          game {
            __typename
            id
            name
            submission(studentId: $studentId) { id points createdAt }
          }
        }
      }
    }
  }
`);

export const PlayerWordAudioQuery = gql(`
  query PlayerWordAudio($word: String!) {
    word(wordCyrillic: $word) {
      id
      url
    }
  }
`);
