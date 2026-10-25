import { durys } from './_player-fixtures';

export default ({ id }: { id: string }) => ({ durysAssignment: { ...durys(id), submission: false } });
