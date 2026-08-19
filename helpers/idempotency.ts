import * as Crypto from "expo-crypto";

export const generateIdempotencyKey = (): string => {
  return Crypto.randomUUID();
};
