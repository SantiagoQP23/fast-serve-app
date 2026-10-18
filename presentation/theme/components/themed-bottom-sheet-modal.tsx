import {
  BottomSheetModal,
  BottomSheetMethods,
  type BottomSheetProps,
} from "@expo/ui/community/bottom-sheet";
import { forwardRef } from "react";
import { View, useWindowDimensions } from "react-native";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { SheetToaster } from "@/presentation/shared/components/app-toaster";

export type ThemedBottomSheetModalProps = BottomSheetProps;

/**
 * Material 3 caps the native sheet at 640dp on large screens, but the RN
 * content is still laid out at the window width and gets clipped.
 */
const SHEET_MAX_WIDTH = 640;

/**
 * BottomSheetModal wrapper that applies the current theme's background color
 * to the native sheet container on iOS, Android, and web.
 */
export const ThemedBottomSheetModal = forwardRef<
  BottomSheetMethods,
  ThemedBottomSheetModalProps
>(({ backgroundStyle, children, ...props }, ref) => {
  const backgroundColor = useThemeColor({}, "background");
  const { width } = useWindowDimensions();

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={[{ backgroundColor }, backgroundStyle]}
      {...props}
    >
      {width > SHEET_MAX_WIDTH ? (
        <View
          style={{ width: SHEET_MAX_WIDTH, alignSelf: "center", flexGrow: 1 }}
        >
          {children}
          <SheetToaster />
        </View>
      ) : (
        <>
          {children}
          <SheetToaster />
        </>
      )}
    </BottomSheetModal>
  );
});

ThemedBottomSheetModal.displayName = "ThemedBottomSheetModal";
