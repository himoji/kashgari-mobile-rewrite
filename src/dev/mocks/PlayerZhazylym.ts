import { zhazylym } from './_player-fixtures';

// a1 is already submitted in the school list mock, so the player sends it to its result.
export default ({ id }: { id: string }) => ({
  zhazylym: { ...zhazylym(id), submission: id === 'a1' ? { __typename: 'ZhazylymSubmission', id: 'zs1' } : null },
});
