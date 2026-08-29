import {
  BottomSheetModal,
  BottomSheetMethods,
  type BottomSheetProps,
} from "@expo/ui/community/bottom-sheet";
import { forwardRef } from "react";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

export type ThemedBottomSheetModalProps = BottomSheetProps;

/**
 * BottomSheetModal wrapper that applies the current theme's background color
 * to the native sheet container on iOS, Android, and web.
 */
export const ThemedBottomSheetModal = forwardRef<
  BottomSheetMethods,
  ThemedBottomSheetModalProps
>(({ backgroundStyle, ...props }, ref) => {
  const backgroundColor = useThemeColor({}, "background");

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={[{ backgroundColor }, backgroundStyle]}
      {...props}
    />
  );
});

ThemedBottomSheetModal.displayName = "ThemedBottomSheetModal";
