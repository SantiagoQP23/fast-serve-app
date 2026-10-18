import { Platform } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { useEffect } from "react";

import { typography } from "@/constants/theme";
import tw from "@/presentation/theme/lib/tailwind";
import { useSheetToasterStore } from "@/presentation/shared/store/useSheetToasterStore";

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

function BaseToaster({ offset }: { offset?: number }) {
  return (
    <Toaster
      style={{ zIndex: 50000 }}
      offset={offset}
      toastOptions={{
        titleStyle: { fontFamily: typography.medium },
        descriptionStyle: { fontFamily: typography.regular },
        actionButtonTextStyle: { fontFamily: typography.medium },
        cancelButtonTextStyle: { fontFamily: typography.medium },
        style: { backgroundColor: tw.color("surface-container-low") },
      }}
    />
  );
}

/**
 * App-wide toaster. On Android, native sheets are Compose dialog windows drawn
 * above the whole React root, so while one is open its own toaster
 * (`SheetToaster`) takes over and this one unmounts.
 */
export function RootToaster() {
  const sheetHostsToasts = useSheetToasterStore((state) => state.hostCount > 0);

  if (sheetHostsToasts) return null;
  return <BaseToaster />;
}

/**
 * Renders toasts inside a native sheet so they appear above it instead of
 * under its window. iOS doesn't need it: sonner already lifts the toaster into
 * a full-window overlay there.
 */
export function SheetToaster() {
  const registerHost = useSheetToasterStore((state) => state.registerHost);
  const unregisterHost = useSheetToasterStore((state) => state.unregisterHost);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    registerHost();
    return unregisterHost;
  }, [registerHost, unregisterHost]);

  if (Platform.OS !== "android") return null;

  // No full-size wrapper here (e.g. a GestureHandlerRootView): it would sit on
  // top of the sheet and swallow every tap. The window insets don't apply inside
  // the sheet either, so anchor the toasts to its top edge.
  return (
    <SafeAreaInsetsContext.Provider value={NO_INSETS}>
      <BaseToaster offset={8} />
    </SafeAreaInsetsContext.Provider>
  );
}
