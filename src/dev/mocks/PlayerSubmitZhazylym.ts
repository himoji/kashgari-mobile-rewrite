export default ({ zhazylymId }: { zhazylymId: string }) => ({ submitZhazylym: { __typename: 'ZhazylymSubmission', id: `zs-${zhazylymId}` } });
