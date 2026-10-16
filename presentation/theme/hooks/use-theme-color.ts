import type { Palette } from "@/constants/theme";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

/**
 * Returns a color role from the active theme. `props.light` overrides it
 * in the light theme only (kept for existing `lightColor` props).
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof Palette,
) {
  const palette = usePalette();
  return props.light ?? palette[colorName];
}
