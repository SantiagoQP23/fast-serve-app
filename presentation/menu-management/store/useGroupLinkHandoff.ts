import { create } from "zustand";

/**
 * Hands a group created from a product's customization back to that screen,
 * which links it on return. `take` reads it once and clears it.
 */
interface GroupLinkHandoffState {
  createdGroupId: string | null;
  setCreatedGroupId: (id: string) => void;
  take: () => string | null;
}

export const useGroupLinkHandoff = create<GroupLinkHandoffState>()(
  (set, get) => ({
    createdGroupId: null,
    setCreatedGroupId: (createdGroupId) => set({ createdGroupId }),
    take: () => {
      const id = get().createdGroupId;
      if (id) set({ createdGroupId: null });
      return id;
    },
  }),
);
