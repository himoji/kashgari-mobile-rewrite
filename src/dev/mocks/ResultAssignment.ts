import { assignment, submission } from './_player-fixtures';

// a1: the open answer still waits for the teacher (the catalog's "Жауап жіберілді" state).
export default ({ id }: { id: string }) => ({ assignment: { ...assignment(id), submission: submission(id, id === 'a1') } });
