import { useEffect, useRef, useState } from "react";
import { useNavigationContainerRef } from "expo-router";

import { useThemeStore } from "@/presentation/theme/store/useThemeStore";

type NavigationContainerRef = ReturnType<typeof useNavigationContainerRef>;
type RootState = ReturnType<NavigationContainerRef["getRootState"]>;

/** Matches the root layout's remount key. */
const appearanceKey = (state: { theme: string; font: string }) =>
  `${state.theme}-${state.font}`;

/**
 * The root layout remounts the navigator when the theme or font changes, and a
 * navigator that unmounts drops its state, so the app would restart from its
 * initial screen. This snapshots the navigation state as they change and
 * restores it once the new navigator has mounted.
 *
 * Returns true until the restore is done, so the layout can hide the initial
 * screen that mounts in between.
 */
export function usePreserveNavigationOnThemeChange() {
  const navigationRef = useNavigationContainerRef();
  const theme = useThemeStore(appearanceKey);
  const snapshotRef = useRef<RootState>(undefined);
  const [restoredTheme, setRestoredTheme] = useState(theme);

  // Runs inside setTheme / setFont, before React renders the remount, so the
  // state of the old navigator is still readable.
  useEffect(
    () =>
      useThemeStore.subscribe((state, previous) => {
        if (
          appearanceKey(state) !== appearanceKey(previous) &&
          navigationRef.isReady()
        ) {
          snapshotRef.current = navigationRef.getRootState();
        }
      }),
    [navigationRef],
  );

  // Must be a passive effect: the new navigator registers itself with the
  // container in its own passive effect, which runs before this parent's.
  useEffect(() => {
    if (restoredTheme === theme) return;

    const snapshot = snapshotRef.current;
    snapshotRef.current = undefined;

    try {
      const root = navigationRef.isReady()
        ? navigationRef.getRootState()
        : undefined;
      // resetRoot targets the navigator by key, and the new one has its own.
      if (snapshot && root)
        navigationRef.resetRoot({ ...snapshot, key: root.key });
    } finally {
      setRestoredTheme(theme);
    }
  }, [theme, restoredTheme, navigationRef]);

  return restoredTheme !== theme;
}
