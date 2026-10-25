import { gql } from '@/graphql';

export const RANKINGS_CLASSMATES = gql(`
  query RankingsClassmatesQuery($studentId: ID!) {
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

/** Every class of the student's school (through its teachers), with each student's acorns. */
export const RANKINGS_CLASSES = gql(`
  query RankingsClassesQuery($studentId: ID!) {
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
                id
                grade
                letter
                students {
                  id
                  acorns
                }
              }
            }
          }
        }
      }
    }
  }
`);
