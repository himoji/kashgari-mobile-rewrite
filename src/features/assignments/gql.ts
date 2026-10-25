import { gql } from '@/graphql';

/** Everything a student is assigned in their class, across modules, with their own submission. */
export const STUDENT_ASSIGNMENTS = gql(`
  query StudentAssignments($studentId: ID!) {
    student(id: $studentId) {
      id
      class {
        id
        assignments {
          __typename
          id
          name
          visible
          deadline
          duration
          createdAt
          submission(studentId: $studentId) {
            id
            createdAt
            wordShuffle { total correct }
            wordMatch { total correct }
            trueFalse { total correct }
            multipleChoice { total correct }
            wordGrid { total correct }
            crossword { total correct }
            completeV2 { total correct }
          }
        }
        zhazylymAssignments {
          __typename
          id
          name
          deadline
          duration
          opensAt
          createdAt
          submission(studentId: $studentId) { id createdAt points }
        }
        oynaGames {
          __typename
          id
          name
          duration
          maxPoints
          createdAt
          submission(studentId: $studentId) { id createdAt points }
        }
        durysAssignments {
          id
          createdAt
          durysTitle { title }
          submission(studentId: $studentId)
        }
        lessons {
          id
          name
          visible
          opensAt
          activities {
            __typename
            ... on TextActivity { estTimeText estTimeGames }
            ... on OynaActivity { estTime }
            ... on DurysActivity { estTime }
          }
          submission(studentId: $studentId) {
            createdAt
            submissions { __typename }
          }
        }
      }
    }
  }
`);
