import { useEffect, useRef } from "react";
import { ActivityIndicator } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";

/**
 * Non-dismissible bottom sheet shown while a websocket event is in flight.
 * The message reflects the most recent pending event (e.g. "Creating order...").
 */
export function SocketLoaderBottomSheet() {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const socketLoadingQueue = useGlobalStore(
    (state) => state.socketLoadingQueue,
  );

  const isLoading = socketLoadingQueue.length > 0;
  const currentEntry = socketLoadingQueue[socketLoadingQueue.length - 1];
  const message = currentEntry
    ? t(currentEntry.messageKey, {
        defaultValue: t("common:socketLoader.default"),
      })
    : "";

  useEffect(() => {
    if (isLoading) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isLoading]);

  return (
    <ThemedBottomSheetModal
      ref={bottomSheetRef}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={false}
      handleComponent={null}
    >
      <BottomSheetView
        style={tw`items-center justify-center py-10 px-6 gap-4`}
      >
        <ActivityIndicator size="large" color={tw.color("light-primary")} />
        <ThemedText type="body1" style={tw`text-center`}>
          {message}
        </ThemedText>
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}
