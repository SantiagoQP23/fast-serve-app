import { create } from "zustand";

export interface AuthorizationResult {
  ok: boolean;
  /** Server error code, e.g. ORDER_AUTH_CODE_INVALID. */
  code?: string;
  msg?: string;
}

export interface AuthorizationRequest {
  /** What the code is for, e.g. "Eliminar 1 × Coca-Cola". */
  summary: string;
  /** Sends the action with the typed code. */
  submit: (code: string) => Promise<AuthorizationResult>;
}

interface AuthorizationCodeState {
  request: AuthorizationRequest | null;
  open: (request: AuthorizationRequest) => void;
  close: () => void;
}

/** Drives the one code sheet mounted in the root layout. */
export const useAuthorizationCodeStore = create<AuthorizationCodeState>()(
  (set) => ({
    request: null,
    open: (request) => set({ request }),
    close: () => set({ request: null }),
  }),
);
