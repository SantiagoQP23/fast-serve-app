import { Colors } from "./constants/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        light: {
          primary: Colors.light.primary,
          secondary: Colors.light.secondary,

          background: Colors.light.background,
          surface: Colors.light.surface,

          text: Colors.light.text,
          icon: Colors.light.icon,
          border: Colors.light.border,
          divider: Colors.light.divider,
        },
        dark: {
          primary: Colors.dark.primary,
          secondary: Colors.dark.secondary,
          tertiary: Colors.dark.tertiary,
          background: Colors.dark.background,
          text: Colors.dark.text,
        },
      },
    },
  },
  plugins: [],
};
