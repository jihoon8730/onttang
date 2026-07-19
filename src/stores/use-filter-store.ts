import { create } from "zustand";

type FilterState = {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  // 검색 스크린에서 고른 장소 — 지도가 소비 후 다시 null로
  pendingFocusId: string | null;
  setPendingFocusId: (id: string | null) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  pendingFocusId: null,
  setPendingFocusId: (id) => set({ pendingFocusId: id }),
}));
