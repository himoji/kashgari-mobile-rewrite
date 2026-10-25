import { gql } from '@/graphql';

/** The parent's children: each child account with its student profiles (class, school, teacher). */
export const CHILDREN = gql(`
  query Children($parentId: ID!) {
    parent(id: $parentId) {
      id
      name
      children {
        id
        streak
        languageLevel
        studentProfiles {
          id
          name
          class {
            ...ClassLabel
            teacher { id name school { id name } }
          }
        }
      }
    }
  }
`);

/** A child's vocabulary: learned words and words still being learned (`isPending`). */
export const CHILD_WORDS = gql(`
  query ChildrenWords($studentId: ID!) {
    student(id: $studentId) {
      id
      words { word level isPending }
    }
  }
`);

/** Links a child by their student profile id (the API resolves the child's account from it). */
export const ADD_CHILD = gql(`
  mutation ChildrenAddChild($parentId: ID!, $studentId: ID!) {
    addChild(parentId: $parentId, studentId: $studentId)
  }
`);
