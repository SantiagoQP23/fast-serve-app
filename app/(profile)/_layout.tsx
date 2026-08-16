import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";

export default function OrdersLayout() {
  const { t } = useTranslation(["auth", "orders"]);
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
      <Stack
        screenOptions={{
          headerShown: false,

          headerTitleStyle: { fontFamily: typography.medium },
        }}
      >
        <Stack.Screen
          name="restaurants/index"
          options={{
            headerShown: true,
            title: "My restaurants",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="restaurant"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="all-orders"
          options={{
            headerShown: true,
            title: t("orders:drawer.allOrders"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="history"
          options={{
            headerShown: true,
            title: t("orders:drawer.history"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="printers"
          options={{
            headerShown: true,
            title: "Printers",
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="production-areas"
          options={{
            headerShown: true,
            title: t("manage.productionAreas"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: t("manage.settings"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="edit-profile/index"
          options={{
            headerShown: false,
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
