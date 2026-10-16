import {
  palettes,
  colorScaleOverrides,
  DEFAULT_THEME,
} from "./constants/theme";

const toKebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Builds the Tailwind config for one theme. Palette roles become
 * prefix-free classes (`bg-surface`, `text-on-surface-variant`), and the
 * theme's color scale overrides replace Tailwind's defaults (e.g. `gray`).
 *
 * @param {import("./constants/theme").ThemeName} themeName
 * @returns {import('tailwindcss').Config}
 */
function buildTailwindConfig(themeName) {
  const roles = Object.fromEntries(
    Object.entries(palettes[themeName]).map(([key, value]) => [
      toKebab(key),
      value,
    ]),
  );

  return {
    theme: {
      extend: {
        colors: {
          ...colorScaleOverrides[themeName],
          ...roles,
        },
        fontFamily: {
          inter: ["Inter_400Regular"],
          "inter-medium": ["Inter_500Medium"],
          "inter-semibold": ["Inter_600SemiBold"],
          "inter-bold": ["Inter_700Bold"],
          "inter-extrabold": ["Inter_800ExtraBold"],
        },
        screens: {
          sm: "480px", // teléfonos grandes
          md: "768px", // tablet
          lg: "1024px", // tablet grande
        },
      },
    },
    plugins: [],
  };
}

module.exports = buildTailwindConfig(DEFAULT_THEME);
module.exports.buildTailwindConfig = buildTailwindConfig;
