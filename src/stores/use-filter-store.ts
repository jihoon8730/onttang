import { create } from "zustand";

type FilterState = {
  searchQuery: string;
  selectedCategory: string | null;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  setSelectedCategory: (category: string | null) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: "",
  selectedCategory: null,
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  clearFilters: () => set({ searchQuery: "", selectedCategory: null }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
