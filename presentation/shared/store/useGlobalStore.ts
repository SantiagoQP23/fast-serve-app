import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/core/i18n/i18n.config";
import type { LanguageCode } from "@/core/i18n/i18n.config";

export interface GlobalStoreState {
  isLoading: boolean;
  language: LanguageCode;
  httpActiveRequests: number;
  setIsLoading: (isLoading: boolean) => void;
  setLanguage: (language: LanguageCode) => Promise<void>;
  incrementHttpActiveRequests: () => void;
  decrementHttpActiveRequests: () => void;
}

export const useGlobalStore = create<GlobalStoreState>()(
  persist(
    (set) => ({
      isLoading: false,
      language: 'es', // Default to Spanish as per requirements
      httpActiveRequests: 0,
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      setLanguage: async (language: LanguageCode) => {
        await i18n.changeLanguage(language);
        set({ language });
      },
      incrementHttpActiveRequests: () =>
        set((state) => ({ httpActiveRequests: state.httpActiveRequests + 1 })),
      decrementHttpActiveRequests: () =>
        set((state) => ({
          httpActiveRequests: Math.max(0, state.httpActiveRequests - 1),
        })),
    }),
    {
      name: "global-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }), // Only persist language
    }
  )
);
