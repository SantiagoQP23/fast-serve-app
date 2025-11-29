import { create } from "zustand";

export interface GlobalStoreState {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useGlobalStore = create<GlobalStoreState>()((set) => ({
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));
