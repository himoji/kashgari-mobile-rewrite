import { filterLibrary, libraryItems, sectionName } from '@/features/materials/library-items';
import { levelOf, materialParam, parseMaterialParam } from '@/features/materials/material-ref';

const grade = {
  __typename: 'Grade' as const,
  grade: 7,
  sections: [
    {
      __typename: 'Section' as const,
      section: 1,
      name: { __typename: 'Name' as const, kazakh: 'Табиғат және адам', russian: 'Природа и человек', english: null },
      oqylymTexts: [{ __typename: 'OqylymText' as const, id: '1', title: 'Табиғат — біздің ортақ үйіміз', complexity: 3, thumbnail: null }],
      tyndalymTexts: [{ __typename: 'TyndalymText' as const, id: '1', title: 'Алматыдағы бір күн', complexity: 2, thumbnail: 'x.png' }],
    },
  ],
};

describe('material refs', () => {
  it('round-trips the route param', () => {
    expect(parseMaterialParam(materialParam({ kind: 'tyndalym', id: '42' }))).toEqual({ kind: 'tyndalym', id: '42' });
    expect(parseMaterialParam('video:1')).toBeNull();
    expect(parseMaterialParam('oqylym:')).toBeNull();
    expect(parseMaterialParam(undefined)).toBeNull();
  });

  it('maps complexity to CEFR', () => {
    expect(levelOf(1)).toBe('A1');
    expect(levelOf(3)).toBe('B1');
    expect(levelOf(0)).toBeNull();
    expect(levelOf(null)).toBeNull();
  });
});

describe('library items', () => {
  const items = libraryItems(grade, [{ id: 'g1', title: 'Тәуелдік жалғауы' }], (s) => sectionName(s.name, s.section, 'en', 'Section'));

  it('keeps reading and listening texts with the same id apart', () => {
    expect(items.map((i) => `${i.ref.kind}:${i.ref.id}`)).toEqual(['oqylym:1', 'tyndalym:1', 'grammar:g1']);
    expect(items[0]).toMatchObject({ grade: 7, level: 'B1', topic: 'Табиғат және адам' });
  });

  it('filters by module, level and search', () => {
    expect(filterLibrary(items, { module: 'tyndalym', level: 'all', search: '' })).toHaveLength(1);
    expect(filterLibrary(items, { module: 'all', level: 'B1', search: '' })).toHaveLength(1);
    expect(filterLibrary(items, { module: 'all', level: 'all', search: 'алматы' })[0]?.ref.kind).toBe('tyndalym');
    expect(filterLibrary(items, { module: 'all', level: 'all', search: 'табиғат және' })).toHaveLength(2);
  });

  it('falls back to Kazakh and then a numbered label', () => {
    expect(sectionName({ kazakh: 'Қ', russian: null, english: null }, 2, 'ru', 'Раздел')).toBe('Қ');
    expect(sectionName(null, 2, 'ru', 'Раздел')).toBe('Раздел 2');
  });
});
