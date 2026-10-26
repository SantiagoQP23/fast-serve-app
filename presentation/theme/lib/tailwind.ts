import { create, type TailwindFn } from "twrnc";

import {
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  type AccentName,
  type ThemeName,
} from "@/constants/theme";

const { buildTailwindConfig } = require(`../../../tailwind.config.js`);

/** The runtime methods twrnc adds to every instance (used by useDeviceContext). */
type TwInstance = TailwindFn & {
  setColorScheme: (colorScheme: "light" | "dark" | null | undefined) => void;
  getColorScheme: () => "light" | "dark" | null | undefined;
  updateDeviceContext: (...args: any[]) => void;
};

type ThemeKey = `${ThemeName}-${AccentName}`;

// One twrnc instance per theme and ink, built on first use.
const instances: Partial<Record<ThemeKey, TwInstance>> = {};

const instanceFor = (themeName: ThemeName, accent: AccentName): TwInstance => {
  const key: ThemeKey = `${themeName}-${accent}`;
  instances[key] ??= create(
    buildTailwindConfig(themeName, accent),
  ) as TwInstance;
  return instances[key];
};

let activeTheme: ThemeKey = `${DEFAULT_THEME}-${DEFAULT_ACCENT}`;
let current = instanceFor(DEFAULT_THEME, DEFAULT_ACCENT);
let colorScheme: ReturnType<TwInstance["getColorScheme"]>;
let deviceContext: any[] | null = null;

/**
 * The app's `tw`. It forwards to the active theme's twrnc instance, so
 * `tw\`bg-surface\`` and `tw.color("gray-500")` follow the selected theme.
 */
const tw = ((strings: TemplateStringsArray, ...values: (string | number)[]) =>
  current(strings, ...values)) as TwInstance;

tw.style = (...inputs) => current.style(...inputs);
tw.color = (color) => current.color(color);
tw.prefixMatch = (...prefixes) => current.prefixMatch(...prefixes);
tw.setColorScheme = (newColorScheme) => {
  colorScheme = newColorScheme;
  current.setColorScheme(newColorScheme);
};
tw.getColorScheme = () => current.getColorScheme();
tw.updateDeviceContext = (...args) => {
  deviceContext = args;
  current.updateDeviceContext(...args);
};
Object.defineProperty(tw, "memoBuster", {
  get: () => `${current.memoBuster}--${activeTheme}`,
});

/** Switches `tw` to another theme or ink. Screens must re-render to pick it up. */
export function setTwTheme(themeName: ThemeName, accent: AccentName) {
  const key: ThemeKey = `${themeName}-${accent}`;
  if (key === activeTheme) return;
  activeTheme = key;
  current = instanceFor(themeName, accent);
  if (colorScheme !== undefined) current.setColorScheme(colorScheme);
  if (deviceContext) current.updateDeviceContext(...deviceContext);
}

export default tw;
