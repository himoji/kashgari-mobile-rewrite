import { gql } from '@/graphql';

/** League points are the student's acorns; the account level picks which free texts to offer. */
export const LEAGUE_STUDENT = gql(`
  query LeagueStudent($studentId: ID!) {
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

// Text only: the page count needs the words, and `image` is an inline base64 picture (10 MB for the kk list).
export const LEAGUE_BOOKS = gql(`
  query LeagueBooks($complexity: Int!) {
    oqylymTextsByComplexity(complexity: $complexity) {
      id
      title
      paragraphs {
        text
      }
    }
  }
`);
