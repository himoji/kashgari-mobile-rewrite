export default ({ durysAssignmentId }: { durysAssignmentId: string }) => ({
  submitDurysAssignment: { __typename: 'DurysSubmission', id: `ds-${durysAssignmentId}` },
});
