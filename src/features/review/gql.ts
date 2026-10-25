import { gql } from '@/graphql';


export const REVIEW_ZHAZYLYM_SUBMISSION = gql(`
  query ReviewZhazylymSubmission($id: ID!) {
    zhazylymSubmission(id: $id) {
      id
      createdAt
      text
      points
      student { id name class { id grade letter } }
      assignment {
        __typename
        id
        name
        minWords
        ... on WordZhazylym { words }
        ... on ImageZhazylym { words imagesDownload }
      }
    }
  }
`);

export const REVIEW_MINI_STORY_SUBMISSION = gql(`
  query ReviewMiniStorySubmission($id: ID!) {
    miniStorySubmission(id: $id) {
      id
      createdAt
      text
      points
      student { id name class { id grade letter } }
      game { id name words maxPoints }
    }
  }
`);

export const REVIEW_ASSIGNMENT_SUBMISSION = gql(`
  query ReviewAssignmentSubmission($id: ID!) {
    submission(id: $id) {
      id
      createdAt
      student { id name class { id grade letter } }
      assignment { id name }
      multipleChoice { correct total questions { question { question } answer } }
      trueFalse { correct total questions { question { question answer } answer } }
      freeResponse { questions { question { question } answer grade } }
      wordShuffle { correct total }
      wordMatch { correct total }
      completeV2 { correct total }
      wordGrid { correct total }
      crossword { correct total }
    }
  }
`);

export const REVIEW_GRADE_ZHAZYLYM = gql(`
  mutation ReviewGradeZhazylym($id: ID!, $points: Int!) {
    zhazylymGrade(submissionId: $id, points: $points) { id points }
  }
`);

export const REVIEW_GRADE_MINI_STORY = gql(`
  mutation ReviewGradeMiniStory($id: ID!, $points: Int!) {
    miniStoryGrade(submissionId: $id, points: $points) { id points }
  }
`);

