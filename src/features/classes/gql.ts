import { gql } from '@/graphql';

/** What a class is called on screen ("7А"): see `className`. */
export const CLASS_LABEL = gql(`
  fragment ClassLabel on Class {
    id
    grade
    letter
  }
`);

/** Open-question answers with the teacher's grade (null until graded): see `hasUngradedAnswer`. */
export const FREE_RESPONSE_GRADES = gql(`
  fragment FreeResponseGrades on SubmissionFreeResponse {
    questions { answer grade }
  }
`);

/**
 * A class with its roster, every kind of work and each submission's score: the input of
 * `mapClassWork` (class-data.ts). Spread it into any query that lists classes (teacher, principal).
 */
export const CLASS_WORK = gql(`
  fragment ClassWork on Class {
    ...ClassLabel
    students {
      id
      name
      durysSubmissions { id createdAt assignment { id } }
    }
    assignments {
      __typename
      id
      name
      visible
      deadline
      createdAt
      submissions {
        id
        createdAt
        student { id }
        wordShuffle { correct total }
        wordMatch { correct total }
        completeV2 { correct total }
        trueFalse { correct total }
        multipleChoice { correct total }
        wordGrid { correct total }
        crossword { correct total }
        freeResponse { ...FreeResponseGrades }
      }
    }
    zhazylymAssignments {
      __typename
      id
      name
      deadline
      opensAt
      createdAt
      submissions { id createdAt points student { id } }
    }
    oynaGames {
      __typename
      id
      name
      createdAt
      maxPoints
      submissions { id createdAt points student { id } }
    }
    durysAssignments { id createdAt durysTitle { id title } }
    lessons {
      id
      name
      visible
      opensAt
      activitiesType
      students { id }
      submissions { createdAt student { id } }
    }
  }
`);
