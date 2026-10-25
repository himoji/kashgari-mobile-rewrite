import { now, zhazylym } from './_player-fixtures';

export default ({ id }: { id: string }) => ({
  zhazylym: {
    ...zhazylym(id),
    submission: {
      __typename: 'ZhazylymSubmission',
      id: `zs-${id}`,
      createdAt: now() - 86400,
      text: 'Атамның бағында алма ағаштары өседі. Біз ағаштарға су құямыз. Күзде бақта қызыл алма піседі.',
      points: id === 'a7' ? 8 : null,
    },
  },
});
