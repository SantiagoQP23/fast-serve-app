import { Account } from "@/core/restaurant/models/account.model";
import { AsyncStorageAdapter } from "@/helpers/adapters/async-storage.adapter";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AccountsState {
  accounts: Account[];
  restaurantId: string | null;
  lastUpdated: number | null;
}

interface AccountsActions {
  setAccounts: (accounts: Account[], restaurantId: string) => void;
  upsertAccount: (account: Account) => void;
  removeAccount: (id: number) => void;
  clearAccounts: () => void;
  reset: () => void;
}

const initialState: AccountsState = {
  accounts: [],
  restaurantId: null,
  lastUpdated: null,
};

export const useAccountsStore = create<AccountsState & AccountsActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAccounts: (accounts, restaurantId) =>
        set({ accounts, restaurantId, lastUpdated: Date.now() }),

      upsertAccount: (account) =>
        set((state) => {
          const exists = state.accounts.some((a) => a.id === account.id);
          return {
            accounts: exists
              ? state.accounts.map((a) => (a.id === account.id ? account : a))
              : [...state.accounts, account],
            lastUpdated: Date.now(),
          };
        }),

      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          lastUpdated: Date.now(),
        })),

      clearAccounts: () =>
        set({ accounts: [], restaurantId: null, lastUpdated: null }),

      reset: () => set(initialState),
    }),
    {
      name: "accountsStore",
      storage: createJSONStorage(() => AsyncStorageAdapter),
    },
  ),
);
