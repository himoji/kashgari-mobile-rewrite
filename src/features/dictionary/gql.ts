import { gql } from '@/graphql';

/** `metadata` makes the lookup count as a word click (acorns) for that student and assignment. */
export const DICTIONARY_WORD = gql(`
  query DictionaryWord($word: String!, $metadata: WordMetadata) {
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

/** Just enough of a dictionary entry to build its pronunciation URL (see `wordAudioUrl`). */
export const WORD_AUDIO = gql(`
  query WordAudio($word: String!) {
    word(wordCyrillic: $word) {
      id
      url
    }
  }
`);

export const DICTIONARY_REQUEST_DEFINITION = gql(`
  mutation DictionaryRequestDefinition($word: String!) {
    requestDefinition(word: $word)
  }
`);
