import { gql } from '@/graphql';

export const RANKINGS_CLASSMATES = gql(`
  query RankingsClassmates($studentId: ID!) {
    student(id: $studentId) {
      id
      class {
        id
        students {
          id
          name
          acorns
        }
      }
    }
  }
`);

/** One class on the school board: its label and each student's acorns (input of `classRows`). */
export const RANKINGS_CLASS = gql(`
  fragment RankingsClass on Class {
    ...ClassLabel
    students {
      id
      acorns
    }
  }
`);

/** Every class of the student's school (through its teachers), with each student's acorns. */
export const RANKINGS_CLASSES = gql(`
  query RankingsClasses($studentId: ID!) {
    student(id: $studentId) {
      id
      class {
        id
        teacher {
          id
          school {
            id
            teachers {
              id
              classes {
                ...RankingsClass
              }
            }
          }
        }
      }
    }
  }
`);
