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
      }
    }
  }
`);

/**
 * Examples ride in their own query: the API can fail on one example's text, and since every field
 * up to `word` is non-null, that would otherwise null the whole entry and lose the definition too.
 */
export const DICTIONARY_WORD_EXAMPLES = gql(`
  query DictionaryWordExamples($word: String!) {
    word(wordCyrillic: $word) {
      id
      definitions {
        id
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
