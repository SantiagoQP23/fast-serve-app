import { Product } from "@/core/menu/models/product.model";
import { create } from "zustand";

interface MenuState {
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
  reset: () => void;
}

const initialState = {
  activeProduct: null,
};

export const useMenuStore = create<MenuState>((set) => ({
  ...initialState,
  setActiveProduct: (product: Product | null) =>
    set({ activeProduct: product }),
  reset: () => set(initialState),
}));
