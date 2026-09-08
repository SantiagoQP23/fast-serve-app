import { User } from "../models/user.model";

export function getUserDisplayName(
  user: User | undefined,
  fallback: string,
): string {
  if (!user) return fallback;
  const firstName = user.person?.firstName ?? "";
  const lastName = user.person?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || fallback;
}

export function getUserInitials(
  user: User | undefined,
  fallback: string,
): string {
  if (!user) return fallback;
  const firstInitial = user.person?.firstName?.[0] ?? "";
  const lastInitial = user.person?.lastName?.[0] ?? "";
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials || fallback;
}
