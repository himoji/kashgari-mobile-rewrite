import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * The schema is a snapshot of kashgari-api's `src/gql/**` (production has introspection off).
 * Refresh it with `bun run schema:sync` when the backend changes.
 */
const config: CodegenConfig = {
  schema: 'graphql/schema/*.gql',
  documents: ['src/**/*.{ts,tsx}', '!src/graphql/**', '!src/**/__tests__/**'],
  ignoreNoDocuments: true,
  generates: {
    './src/graphql/': {
      preset: 'client',
      presetConfig: { gqlTagName: 'gql', fragmentMasking: false },
      config: { enumsAsTypes: true, useTypeImports: true, scalars: { ID: 'string' } },
    },
    './src/graphql/possible-types.ts': {
      plugins: ['fragment-matcher'],
      config: { useExplicitTyping: true },
    },
  },
};

export default config;
