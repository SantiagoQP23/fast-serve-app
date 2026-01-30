import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";

export default function OrdersLayout() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const closeBottomSheet = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="restaurants/index"
          options={{
            headerShown: true,
            title: "My restaurants",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="restaurant-offline-data"
          options={{
            headerShown: true,
            title: "Restaurant Offline Data",
            headerShadowVisible: false,
          }}
        />
        {/* <Stack.Screen */}
        {/*   name="[id]/edit-order-detail/index" */}
        {/*   options={{ */}
        {/*     headerShown: true, */}
        {/*     title: "", */}
        {/*     headerShadowVisible: false, */}
        {/*   }} */}
        {/* /> */}
        {/* <Stack.Screen */}
        {/*   name="[id]/bills/index" */}
        {/*   options={{ */}
        {/*     headerShown: true, */}
        {/*     title: "", */}
        {/*     headerShadowVisible: false, */}
        {/*   }} */}
        {/* /> */}
        {/* <Stack.Screen */}
        {/*   name="[id]/bills/[id]/index" */}
        {/*   options={{ */}
        {/*     headerShown: true, */}
        {/*     title: "", */}
        {/*     headerShadowVisible: false, */}
        {/*   }} */}
        {/* /> */}
        {/* <Stack.Screen */}
        {/*   name="[id]/bills/new/index" */}
        {/*   options={{ */}
        {/*     headerShown: true, */}
        {/*     title: "", */}
        {/*     headerShadowVisible: false, */}
        {/*   }} */}
        {/* /> */}
      </Stack>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <NewOrderBottomSheet
          onCreateOrder={closeBottomSheet}
          buttonProps={{ label: "Save changes" }}
        />
      </BottomSheetModal>
    </>
  );
}
