export default ({ studentId }: { studentId: string }) => ({
  student: { __typename: 'Student', id: studentId, class: { __typename: 'Class', id: 'c7a' } },
});
