import { gql } from '@/graphql';

/** Everything a teacher grades by hand: open answers, writing and mini stories without a grade yet. */
export const TEACHER_HOME = gql(`
  query TeacherHome($teacherId: ID!) {
    teacher(id: $teacherId) {
      id
      name
      classes {
        id
        assignments {
          id
          submissions {
            id
            freeResponse {
              ...FreeResponseGrades
            }
          }
        }
        zhazylymAssignments {
          id
          submissions {
            id
            points
          }
        }
        oynaGames {
          id
          ... on OynaGameMiniStory {
            submissions {
              id
              points
            }
          }
        }
      }
    }
  }
`);
