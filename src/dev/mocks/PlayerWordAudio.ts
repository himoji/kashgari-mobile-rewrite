export default ({ word }: { word: string }) => ({ word: { __typename: 'Word', id: `w-${word}`, url: '' } });
