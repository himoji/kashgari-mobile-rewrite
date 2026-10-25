import { create } from 'zustand';

/** Where a class filter applies; each School segment and the reports page keeps its own choice. */
export type FilterScope = 'assignments' | 'review' | 'reports';
export const ALL_CLASSES = 'all';

interface FiltersState {
  classFilter: Record<FilterScope, string>;
  setClassFilter: (scope: FilterScope, classId: string) => void;
}

export const useSchoolFilters = create<FiltersState>()((set) => ({
  classFilter: { assignments: ALL_CLASSES, review: ALL_CLASSES, reports: ALL_CLASSES },
  setClassFilter: (scope, classId) => set((s) => ({ classFilter: { ...s.classFilter, [scope]: classId } })),
}));
