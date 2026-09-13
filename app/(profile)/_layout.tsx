import { Colors, typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";

import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";

export default function OrdersLayout() {
  const { t } = useTranslation([
    "auth",
    "orders",
    "menuManagement",
    "tables",
    "paymentMethods",
  ]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);

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
          headerStyle: { backgroundColor: Colors.light.background },

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
            title: t("printers:title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="printer-form/index"
          options={{
            headerShown: false,
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
          name="production-area-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu-sections/index"
          options={{
            headerShown: true,
            title: t("menuManagement:sections.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu-section-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu-categories/index"
          options={{
            headerShown: true,
            title: t("menuManagement:categories.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu-category-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu-products/index"
          options={{
            headerShown: true,
            title: t("menuManagement:products.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu-product-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="tables-settings/index"
          options={{
            headerShown: true,
            title: t("tables:settings.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="table-settings-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="payment-methods-settings/index"
          options={{
            headerShown: true,
            title: t("paymentMethods:title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="account-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="payment-method-form/index"
          options={{
            headerShown: false,
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

        <Stack.Screen
          name="account/index"
          options={{
            headerShown: true,
            title: t("account.title"),
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

      <ThemedBottomSheetModal ref={bottomSheetModalRef}>
        <NewOrderBottomSheet
          onCreateOrder={closeBottomSheet}
          buttonProps={{ label: "Save changes" }}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
