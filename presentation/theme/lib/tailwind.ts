import { create, type TailwindFn } from "twrnc";

import { DEFAULT_THEME, type ThemeName } from "@/constants/theme";

const { buildTailwindConfig } = require(`../../../tailwind.config.js`);

/** The runtime methods twrnc adds to every instance (used by useDeviceContext). */
type TwInstance = TailwindFn & {
  setColorScheme: (colorScheme: "light" | "dark" | null | undefined) => void;
  getColorScheme: () => "light" | "dark" | null | undefined;
  updateDeviceContext: (...args: any[]) => void;
};

// One twrnc instance per theme, built on first use.
const instances: Partial<Record<ThemeName, TwInstance>> = {};

const instanceFor = (themeName: ThemeName): TwInstance => {
  instances[themeName] ??= create(buildTailwindConfig(themeName)) as TwInstance;
  return instances[themeName];
};

let activeTheme: ThemeName = DEFAULT_THEME;
let current = instanceFor(activeTheme);
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

/** Switches `tw` to another theme. Screens must re-render to pick it up. */
export function setTwTheme(themeName: ThemeName) {
  if (themeName === activeTheme) return;
  activeTheme = themeName;
  current = instanceFor(themeName);
  if (colorScheme !== undefined) current.setColorScheme(colorScheme);
  if (deviceContext) current.updateDeviceContext(...deviceContext);
}

export default tw;
