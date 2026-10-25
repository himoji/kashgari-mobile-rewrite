/** A library material: reading and listening texts share ids, so the kind is part of the identity. */
export type MaterialKind = 'oqylym' | 'tyndalym' | 'grammar';
export type MaterialRef = { kind: MaterialKind; id: string };

const KINDS: MaterialKind[] = ['oqylym', 'tyndalym', 'grammar'];

export const materialParam = (ref: MaterialRef) => `${ref.kind}:${ref.id}`;

export function parseMaterialParam(value: unknown): MaterialRef | null {
  if (typeof value !== 'string') return null;
  const i = value.indexOf(':');
  const kind = value.slice(0, i) as MaterialKind;
  const id = value.slice(i + 1);
  return i > 0 && id && KINDS.includes(kind) ? { kind, id } : null;
}

/** Query switches for documents that fetch one material with @include. */
export const kindFlags = (kind: MaterialKind) => ({ oqylym: kind === 'oqylym', tyndalym: kind === 'tyndalym', grammar: kind === 'grammar' });

/** Text complexity is stored as 1..5; the design shows CEFR levels. */
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_OPTIONS = LEVELS.slice(0, 4);
export const levelOf = (complexity?: number | null): Level | null =>
  complexity != null && complexity >= 1 && complexity <= LEVELS.length ? LEVELS[complexity - 1]! : null;
