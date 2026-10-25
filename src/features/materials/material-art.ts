import type { MaterialKind } from '@/features/materials/material-ref';

/** Cover art when a text has no thumbnail, and the cover tint per module (prototype library cards). */
export const materialArt: Record<MaterialKind, number> = {
  oqylym: require('@/assets/images/illustrations/nature.webp'),
  tyndalym: require('@/assets/images/illustrations/city.webp'),
  grammar: require('@/assets/images/illustrations/grammar.webp'),
};

export const coverTint: Record<MaterialKind, string> = { oqylym: '#fff8d6', tyndalym: '#b8eedb', grammar: '#fff0e4' };
