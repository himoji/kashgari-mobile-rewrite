import { gql } from '@/graphql';

/** `metadata` makes the lookup count as a word click (acorns) for that student and assignment. */
export const DICTIONARY_WORD = gql(`
  query DictionaryWordQuery($word: String!, $metadata: WordMetadata) {
    word(wordCyrillic: $word, metadata: $metadata) {
      id
      url
      definitions {
        id
        order
        text
        textRussian
        translationRussian
        translationEnglish
        examples {
          id
          order
          text
        }
      }
    }
  }
`);

export const DICTIONARY_REQUEST_DEFINITION = gql(`
  mutation DictionaryRequestDefinition($word: String!) {
    requestDefinition(word: $word)
  }
`);
