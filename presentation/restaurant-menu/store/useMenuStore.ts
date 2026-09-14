import { Product } from "@/core/menu/models/product.model";
import { Section } from "@/core/menu/models/section.model";
import { Category } from "@/core/menu/models/category.model";
import { Menu } from "@/core/menu/models/menu.model";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";

export interface MenuState {
  // Menu data
  sections: Section[];
  categories: Category[];
  products: Product[];
  restaurantId: string | null;
  lastUpdated: number | null;
  
  // Active product (for navigation)
  activeProduct: Product | null;
}

interface MenuActions {
  setActiveProduct: (product: Product | null) => void;
  setMenu: (menu: Menu, restaurantId: string) => void;
  clearMenu: () => void;
  reset: () => void;
  upsertSection: (section: Section) => void;
  removeSection: (id: string) => void;
  upsertCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
}

const initialState: MenuState = {
  sections: [],
  categories: [],
  products: [],
  restaurantId: null,
  lastUpdated: null,
  activeProduct: null,
};

export const useMenuStore = create<MenuState & MenuActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      setActiveProduct: (product: Product | null) =>
        set({ activeProduct: product }),
      
      setMenu: (menu: Menu, restaurantId: string) =>
        set({
          sections: menu.sections,
          categories: menu.categories,
          products: menu.products,
          restaurantId,
          lastUpdated: Date.now(),
        }),
      
      clearMenu: () =>
        set({
          sections: [],
          categories: [],
          products: [],
          restaurantId: null,
          lastUpdated: null,
        }),
      
      reset: () => set(initialState),

      upsertSection: (section: Section) =>
        set((state) => {
          const exists = state.sections.some((s) => s.id === section.id);
          return {
            sections: exists
              ? state.sections.map((s) => (s.id === section.id ? section : s))
              : [...state.sections, section],
          };
        }),

      upsertCategory: (category: Category) =>
        set((state) => {
          const exists = state.categories.some((c) => c.id === category.id);
          return {
            categories: exists
              ? state.categories.map((c) =>
                  c.id === category.id ? category : c,
                )
              : [...state.categories, category],
          };
        }),

      removeSection: (id: string) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
        })),

      removeCategory: (id: string) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      upsertProduct: (product: Product) =>
        set((state) => {
          const exists = state.products.some((p) => p.id === product.id);
          return {
            products: exists
              ? state.products.map((p) => (p.id === product.id ? product : p))
              : [...state.products, product],
          };
        }),

      removeProduct: (id: string) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "menuStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
