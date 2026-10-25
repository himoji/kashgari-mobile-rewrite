// Every <feature>.json in this folder becomes a namespace: t('<feature>.<key>').
const files = require.context('./', false, /\.json$/);

export default Object.fromEntries(
  files.keys().map((key) => [key.replace(/^\.\/(.*)\.json$/, '$1'), files(key)]),
) as Record<string, Record<string, unknown>>;
