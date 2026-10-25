import { gql } from '@/graphql';

export const ASSIGN_CLASSES = gql(`
  query AssignClassesQuery($teacherId: ID!) {
    teacher(id: $teacherId) {
      id
      classes {
        id
        grade
        letter
      }
    }
  }
`);

/** Ready-made materials for the picker: one grade's texts plus the grammar sets. */
export const ASSIGN_MATERIALS = gql(`
  query AssignMaterialsQuery($grade: Int!, $teacherId: ID!) {
    grade(grade: $grade) {
      grade
      sections {
        section
        oqylymTexts(teacherId: $teacherId) {
          id
          title
        }
        tyndalymTexts(teacherId: $teacherId) {
          id
          title
        }
      }
    }
    allDurysTitles {
      id
      title
    }
  }
`);

/** Title of a material opened from the library ("Тағайындау"). */
export const ASSIGN_MATERIAL = gql(`
  query AssignMaterialQuery($id: ID!, $oqylym: Boolean!, $tyndalym: Boolean!, $grammar: Boolean!) {
    oqylymText(id: $id) @include(if: $oqylym) {
      id
      title
    }
    tyndalymText(id: $id) @include(if: $tyndalym) {
      id
      title
    }
    durysTitle(id: $id) @include(if: $grammar) {
      id
      title
    }
  }
`);

/** The API drafts every exercise type from the text; the teacher picks which ones to keep. */
export const ASSIGN_GAMES = gql(`
  query AssignGamesQuery($textId: ID!) {
    generateGames(textId: $textId) {
      wordShuffle(type: Teacher) {
        pairs {
          shuffled
          word
        }
      }
      wordMatch(type: Teacher) {
        pairs {
          word
          translation
        }
      }
      completeV2(type: Teacher) {
        sentences {
          before
          after
          wordGroup
        }
      }
      trueFalse(type: Teacher) {
        questions {
          question
          answer
        }
      }
      multipleChoice(type: Teacher) {
        questions {
          question
          options
        }
      }
      freeResponse {
        questions {
          question
        }
      }
      wordGrid {
        rows
        words
      }
      crossword(type: Teacher) {
        words {
          row
          col
          direction
          clue
          word
        }
      }
    }
  }
`);

export const ASSIGN_CREATE_TEXT = gql(`
  mutation AssignCreateTextMutation($teacherId: ID!, $text: String!) {
    createOqylymText(teacherId: $teacherId, text: $text) {
      id
      title
    }
  }
`);

export const ASSIGN_CREATE_OQYLYM = gql(`
  mutation AssignCreateOqylymMutation($classId: ID!, $assignment: OqylymAssignmentInput!, $visible: Boolean!) {
    createOqylymAssignment(classId: $classId, assignment: $assignment, visible: $visible) {
      id
    }
  }
`);

export const ASSIGN_CREATE_TYNDALYM = gql(`
  mutation AssignCreateTyndalymMutation($classId: ID!, $assignment: TyndalymAssignmentInput!, $visible: Boolean!) {
    createTyndalymAssignment(classId: $classId, assignment: $assignment, visible: $visible) {
      id
    }
  }
`);

export const ASSIGN_CREATE_GRAMMAR = gql(`
  mutation AssignCreateGrammarMutation($classId: ID!, $titleId: ID!) {
    createDurysAssignment(classId: $classId, data: { titleId: $titleId }) {
      id
    }
  }
`);
