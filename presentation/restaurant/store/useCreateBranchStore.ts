import { create } from "zustand";
import type { BranchRole } from "@/core/restaurant/dto/create-branch.dto";

/** Clave de "Sin zona" en `tables`. */
export const NO_AREA_KEY = "no-area";

/** Mismo límite que al crear un restaurante (lo valida el backend). */
export const BRANCH_MAX_TABLES = 50;

export interface BranchDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface CreateBranchState {
  /** Restaurante del que se crea la sucursal. */
  sourceRestaurantId: string | null;
  details: BranchDetails;
  /** Cantidad de mesas por zona (id de zona o NO_AREA_KEY). */
  tables: Record<string, number>;
  /** Personal elegido con su rol en la sucursal. */
  users: Record<string, BranchRole>;
}

interface CreateBranchActions {
  start: (
    sourceRestaurantId: string,
    details: BranchDetails,
    tables: Record<string, number>,
  ) => void;
  setDetails: (details: BranchDetails) => void;
  setTables: (tables: Record<string, number>) => void;
  setUsers: (users: Record<string, BranchRole>) => void;
  reset: () => void;
}

const initialState = (): CreateBranchState => ({
  sourceRestaurantId: null,
  details: { name: "", address: "", phone: "", email: "" },
  tables: {},
  users: {},
});

/**
 * Borrador de "Crear sucursal" compartido por los tres pasos (datos, mesas,
 * personal), para que volver atrás no pierda lo ingresado. Solo en memoria.
 */
export const useCreateBranchStore = create<
  CreateBranchState & CreateBranchActions
>()((set) => ({
  ...initialState(),
  start: (sourceRestaurantId, details, tables) =>
    set({ ...initialState(), sourceRestaurantId, details, tables }),
  setDetails: (details) => set({ details }),
  setTables: (tables) => set({ tables }),
  setUsers: (users) => set({ users }),
  reset: () => set(initialState()),
}));
