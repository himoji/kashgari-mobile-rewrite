export default (v: { word: string }) => ({ word: { __typename: 'Word', id: 'w1', url: v.word } });
