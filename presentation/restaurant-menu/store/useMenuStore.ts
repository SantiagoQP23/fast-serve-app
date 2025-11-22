import { Product } from "@/core/menu/models/product.model";
import { create } from "zustand";

interface MenuState {
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  activeProduct: null,
  setActiveProduct: (product: Product | null) =>
    set({ activeProduct: product }),
}));
