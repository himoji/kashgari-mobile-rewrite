import { gql } from '@/graphql';

/** `withDef` marks each word with its dictionary form (see parseParagraph). */
export const READER_TEXT = gql(`
  query ReaderText($id: ID!) {
    oqylymText(id: $id) {
      id
      title
      paragraphs(withDef: true) {
        text
        image
      }
    }
  }
`);
