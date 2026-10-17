import { Product, withDefaultOption } from "@/core/menu/models/product.model";
import { ProductOption } from "@/core/menu/models/product-optionl.model";
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
  upsertProducts: (products: Product[]) => void;
  removeProduct: (id: string) => void;
  setProductDefaultOption: (productId: string, variantId: number) => void;
  addProductOption: (productId: string, option: ProductOption) => void;
  updateProductOption: (productId: string, option: ProductOption) => void;
  removeProductOption: (productId: string, optionId: number) => void;
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
    (set, get) => ({
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

      upsertProduct: (product: Product) => get().upsertProducts([product]),

      // One store update (and one save to storage) for many products, e.g.
      // the stock updates a single sale sends for every product it touched.
      upsertProducts: (products: Product[]) =>
        set((state) => {
          if (!products.length) return state;
          const byId = new Map(products.map((p) => [p.id, p]));
          const existing = new Set(state.products.map((p) => p.id));
          const activeProduct = state.activeProduct
            ? (byId.get(state.activeProduct.id) ?? state.activeProduct)
            : state.activeProduct;
          return {
            products: [
              ...state.products.map((p) => byId.get(p.id) ?? p),
              ...[...byId.values()].filter((p) => !existing.has(p.id)),
            ],
            activeProduct,
          };
        }),

      removeProduct: (id: string) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      setProductDefaultOption: (productId: string, variantId: number) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? withDefaultOption(p, variantId) : p,
          ),
          activeProduct:
            state.activeProduct?.id === productId
              ? withDefaultOption(state.activeProduct, variantId)
              : state.activeProduct,
        })),

      addProductOption: (productId: string, option: ProductOption) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  // The sync event may have already upserted this option,
                  // so drop any existing copy before appending.
                  options: [
                    ...p.options
                      .filter((existing) => existing.id !== option.id)
                      .map((existing) =>
                        option.isDefault
                          ? { ...existing, isDefault: false }
                          : existing,
                      ),
                    option,
                  ],
                }
              : p,
          ),
        })),

      updateProductOption: (productId: string, option: ProductOption) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  options: p.options.map((existing) =>
                    existing.id === option.id
                      ? option
                      : option.isDefault
                        ? { ...existing, isDefault: false }
                        : existing,
                  ),
                }
              : p,
          ),
        })),

      removeProductOption: (productId: string, optionId: number) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, options: p.options.filter((o) => o.id !== optionId) }
              : p,
          ),
        })),
    }),
    {
      name: "menuStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
