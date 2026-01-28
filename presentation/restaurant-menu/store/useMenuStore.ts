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
    }),
    {
      name: "menuStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
