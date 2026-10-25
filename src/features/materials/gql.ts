import { gql } from '@/graphql';

/** The teacher's classes (default grade) and the grades that have a curriculum. */
export const MATERIALS_CONTEXT = gql(`
  query MaterialsContext($teacherId: ID!) {
    teacher(id: $teacherId) {
      id
      classes {
        id
        grade
      }
    }
    allGrades {
      grade
      name
    }
  }
`);

/** One grade's curriculum: sections (topics) with their reading and listening texts. */
export const MATERIALS_GRADE = gql(`
  query MaterialsGrade($grade: Int!, $teacherId: ID!) {
    grade(grade: $grade) {
      grade
      sections {
        section
        name {
          kazakh
          russian
          english
        }
        oqylymTexts(teacherId: $teacherId) {
          id
          title
          complexity
          thumbnail(size: W256, url: true)
        }
        tyndalymTexts(teacherId: $teacherId) {
          id
          title
          complexity
          thumbnail(size: W256, url: true)
        }
      }
    }
  }
`);

/** Grammar materials are the "Дұрыс" exercise sets. */
export const MATERIALS_GRAMMAR = gql(`
  query MaterialsGrammar {
    allDurysTitles {
      id
      title
    }
  }
`);

export const MATERIALS_TEXT = gql(`
  query MaterialsText($id: ID!, $oqylym: Boolean!, $tyndalym: Boolean!, $grammar: Boolean!) {
    oqylymText(id: $id) @include(if: $oqylym) {
      id
      title
      complexity
      baseWords
      thumbnail(size: W256, url: true)
      paragraphs {
        text
      }
      section {
        section
        name {
          kazakh
          russian
          english
        }
        grade {
          grade
        }
      }
    }
    tyndalymText(id: $id) @include(if: $tyndalym) {
      id
      title
      complexity
      baseWords
      audioUrl
      thumbnail(size: W256, url: true)
      paragraphs {
        text
      }
      section {
        section
        name {
          kazakh
          russian
          english
        }
        grade {
          grade
        }
      }
    }
    durysTitle(id: $id) @include(if: $grammar) {
      id
      title
    }
  }
`);

export const MATERIALS_WORD_BANK = gql(`
  query MaterialsWordBank {
    topics {
      name
      levels {
        level
        words {
          word
        }
      }
    }
  }
`);

export const MATERIALS_WORD_TRANSLATION = gql(`
  query MaterialsWordTranslation($word: String!) {
    word(wordCyrillic: $word) {
      id
      definitions {
        id
        translationRussian
        translationEnglish
      }
    }
  }
`);
