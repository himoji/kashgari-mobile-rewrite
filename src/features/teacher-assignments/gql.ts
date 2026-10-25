import { gql } from '@/graphql';

/**
 * Everything the teacher's School tab needs in one request: classes, rosters, every kind of work
 * and each submission's score. Class detail, assignment detail, the review queue and the student
 * progress dialog all read this same cached result, so opening them costs no extra round trip.
 */
export const TEACHER_SCHOOL = gql(`
  query TeacherSchool($teacherId: ID!) {
    teacher(id: $teacherId) {
      id
      school { id name }
      classes { ...ClassWork }
    }
  }
`);

/** Exercise list of a reading / listening assignment (the "Мазмұны" disclosure). */
export const TEACHER_ASSIGNMENT_CONTENT = gql(`
  query TeacherAssignmentContent($id: ID!) {
    assignment(id: $id) {
      id
      text { id }
      hasFlashcards
      games {
        wordShuffle(type: Student) { total }
        wordMatch(type: Student) { total }
        completeV2(type: Student) { total }
        trueFalse(type: Student) { total }
        multipleChoice(type: Student) { total }
        freeResponse { questions { question } }
        wordGrid { total }
        crossword(type: Student) { total }
      }
    }
  }
`);

export const TEACHER_UPDATE_ASSIGNMENT_VISIBILITY = gql(`
  mutation TeacherUpdateAssignmentVisibility($id: ID!, $visible: Boolean!) {
    updateAssignment(assignmentId: $id, data: { visible: $visible, updateDuration: false }) { id visible }
  }
`);

export const TEACHER_UPDATE_LESSON_VISIBILITY = gql(`
  mutation TeacherUpdateLessonVisibility($id: ID!, $visible: Boolean!) {
    updateLesson(data: { lessonId: $id, visible: $visible })
  }
`);

export const TEACHER_DELETE_ASSIGNMENT = gql(`mutation TeacherDeleteAssignment($id: ID!) { deleteAssignment(id: $id) }`);
export const TEACHER_DELETE_ZHAZYLYM = gql(`mutation TeacherDeleteZhazylym($id: ID!) { deleteZhazylym(id: $id) }`);
export const TEACHER_DELETE_DURYS = gql(`mutation TeacherDeleteDurys($id: ID!) { deleteDurysAssignment(id: $id) }`);
export const TEACHER_DELETE_LESSON = gql(`mutation TeacherDeleteLesson($id: ID!) { deleteLesson(id: $id) }`);
export const TEACHER_DELETE_MINI_STORY = gql(`mutation TeacherDeleteMiniStory($id: ID!) { miniStoryDelete(id: $id) }`);
export const TEACHER_DELETE_WORDLE = gql(`mutation TeacherDeleteWordle($id: ID!) { wordleDelete(id: $id) }`);
export const TEACHER_DELETE_QUIZLET = gql(`mutation TeacherDeleteQuizlet($id: ID!) { quizletDelete(id: $id) }`);
export const TEACHER_DELETE_WORD_GAME = gql(`mutation TeacherDeleteWordGame($id: ID!) { wordGameDelete(id: $id) }`);

export const TEACHER_EDIT_ASSIGNMENT = gql(`
  mutation TeacherEditAssignment($id: ID!, $name: String!, $deadline: Int!) {
    updateAssignment(assignmentId: $id, data: { name: $name, deadline: $deadline, updateDuration: false }) { id name deadline }
  }
`);
