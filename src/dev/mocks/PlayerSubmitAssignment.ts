export default ({ assignmentId }: { assignmentId: string }) => ({ submitAssignment: { __typename: 'Submission', id: `sub-${assignmentId}` } });
