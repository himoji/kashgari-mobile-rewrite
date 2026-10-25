import { assignment } from './_player-fixtures';

export default ({ id }: { id: string }) => ({ assignment: { ...assignment(id), submission: null } });
