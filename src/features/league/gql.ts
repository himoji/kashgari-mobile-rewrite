import { gql } from '@/graphql';

/** League points are the student's acorns; the account level picks which free texts to offer. */
export const LEAGUE_STUDENT = gql(`
  query LeagueStudentQuery($studentId: ID!) {
    student(id: $studentId) {
      id
      acorns
      account {
        id
        languageLevel
      }
    }
  }
`);

export const LEAGUE_BOOKS = gql(`
  query LeagueBooksQuery($complexity: Int!) {
    oqylymTextsByComplexity(complexity: $complexity) {
      id
      title
      paragraphs {
        text
        image
      }
    }
  }
`);
