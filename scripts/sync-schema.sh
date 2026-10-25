#!/usr/bin/env bash
# Copies kashgari-api's GraphQL schema files into graphql/schema/ (flattened).
# Usage: bun run schema:sync [path-to-kashgari-api]   (default: ../kashgari-api)
set -euo pipefail
API="${1:-../kashgari-api}"
OUT="$(dirname "$0")/../graphql/schema"
rm -f "$OUT"/*.gql
(cd "$API/src/gql" && find . -name '*.gql') | while read -r f; do
  cp "$API/src/gql/$f" "$OUT/$(echo "${f#./}" | tr '/' '_')"
done
echo "Synced $(ls "$OUT" | wc -l) schema files from $API"
