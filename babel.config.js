const { babelOptimizerPlugin } = require('@graphql-codegen/client-preset');

// The optimizer rewrites gql(`...`) to a direct document import but leaves the `gql` import behind, and TypeScript's
// import elision has already run by then. Drop that import once no gql() call is left, so src/graphql/gql.ts is not bundled.
function dropUnusedGqlImport({ types: t }) {
  return {
    visitor: {
      Program: {
        exit(path) {
          let called = false;
          path.traverse({
            CallExpression(call) {
              if (t.isIdentifier(call.node.callee, { name: 'gql' })) called = true;
            },
          });
          if (called) return;
          for (const stmt of path.get('body')) {
            if (stmt.isImportDeclaration() && stmt.node.source.value === '@/graphql') stmt.remove();
          }
        },
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [babelOptimizerPlugin, { artifactDirectory: './src/graphql', gqlTagName: 'gql' }],
      dropUnusedGqlImport,
    ],
  };
};
