import type { MaterialsGradeQuery } from '@/graphql/graphql';
import { levelOf, type Level, type MaterialKind, type MaterialRef } from '@/features/materials/material-ref';

type Grade = NonNullable<MaterialsGradeQuery['grade']>;
type Section = Grade['sections'][number];
type Name = Section['name'];

export type LibraryItem = {
  ref: MaterialRef;
  title: string;
  topic: string | null;
  grade: number | null;
  level: Level | null;
  thumbnail: string | null;
};

export type LibraryFilter = { module: MaterialKind | 'all'; level: Level | 'all'; search: string };

/** Section names come in three languages; Kazakh is the fallback, then "<label> N". */
export function sectionName(name: Name | null | undefined, section: number | null | undefined, lang: string, label: string): string {
  const byLang = lang === 'ru' ? name?.russian : lang === 'en' ? name?.english : name?.kazakh;
  return byLang || name?.kazakh || `${label} ${section ?? ''}`.trim();
}

/** One topic of the curriculum with its texts (reading first, then listening). */
export function topicItems(section: Section, grade: number | null, topic: string): LibraryItem[] {
  const map = (kind: MaterialKind) => (t: Section['oqylymTexts'][number]): LibraryItem => ({
    ref: { kind, id: t.id },
    title: t.title,
    topic,
    grade,
    level: levelOf(t.complexity),
    thumbnail: t.thumbnail ?? null,
  });
  return [...section.oqylymTexts.map(map('oqylym')), ...section.tyndalymTexts.map(map('tyndalym'))];
}

export function libraryItems(
  grade: Grade | null | undefined,
  grammar: { id: string; title: string }[],
  topicName: (section: Section) => string,
): LibraryItem[] {
  const texts = (grade?.sections ?? []).flatMap((s) => topicItems(s, grade?.grade ?? null, topicName(s)));
  const sets = grammar.map((g): LibraryItem => ({ ref: { kind: 'grammar', id: g.id }, title: g.title, topic: null, grade: null, level: null, thumbnail: null }));
  return [...texts, ...sets];
}

export function filterLibrary(items: LibraryItem[], { module, level, search }: LibraryFilter): LibraryItem[] {
  const q = search.trim().toLocaleLowerCase();
  return items.filter(
    (i) =>
      (module === 'all' || i.ref.kind === module) &&
      (level === 'all' || i.level === level) &&
      (!q || i.title.toLocaleLowerCase().includes(q) || (i.topic ?? '').toLocaleLowerCase().includes(q)),
  );
}
