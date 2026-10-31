import { User } from "@/core/auth/models/user.model";

export enum AuthorizationAction {
  DELETE_ITEM = "DELETE_ITEM",
  DECREASE_QUANTITY = "DECREASE_QUANTITY",
  REPLACE_ITEM = "REPLACE_ITEM",
  CANCEL_ORDER = "CANCEL_ORDER",
}

/**
 * One-time code an owner/admin generates so someone else can remove units
 * from an order. Once used it says what it was used for.
 */
export interface AuthorizationCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  voidedAt: string | null;
  usedAt: string | null;
  createdBy: User | null;
  usedBy: User | null;
  action: AuthorizationAction | null;
  order: {
    id: string;
    num: number;
    type?: string;
    table?: { id: string; name: string } | null;
  } | null;
  productName: string | null;
  quantityBefore: number | null;
  quantityAfter: number | null;
}

/** Error codes the server answers when a code is missing or wrong. */
export const AUTHORIZATION_ERROR_CODES = [
  "ORDER_AUTH_CODE_REQUIRED",
  "ORDER_AUTH_CODE_INVALID",
  "ORDER_AUTH_CODE_EXPIRED",
  "ORDER_AUTH_CODE_USED",
  "ORDER_AUTH_CODE_TOO_MANY_ATTEMPTS",
] as const;

export const isAuthorizationError = (code?: string) =>
  !!code && (AUTHORIZATION_ERROR_CODES as readonly string[]).includes(code);

export const AUTHORIZATION_CODE_LENGTH = 6;
