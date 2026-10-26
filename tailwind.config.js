import {
  getPalette,
  colorScaleOverrides,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
} from "./constants/theme";

const toKebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Builds the Tailwind config for one theme and ink. Palette roles become
 * prefix-free classes (`bg-surface`, `text-on-surface-variant`), and the
 * theme's color scale overrides replace Tailwind's defaults (e.g. `gray`).
 *
 * @param {import("./constants/theme").ThemeName} themeName
 * @param {import("./constants/theme").AccentName} [accentName]
 * @returns {import('tailwindcss').Config}
 */
function buildTailwindConfig(themeName, accentName = DEFAULT_ACCENT) {
  const roles = Object.fromEntries(
    Object.entries(getPalette(themeName, accentName)).map(([key, value]) => [
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
