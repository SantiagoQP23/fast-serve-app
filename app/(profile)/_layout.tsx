import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import IconButton from "@/presentation/theme/components/icon-button";

import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export default function OrdersLayout() {
  const palette = usePalette();
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
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,

          headerTitleStyle: { fontFamily: typography.medium },
        }}
      >
        <Stack.Screen
          name="restaurant/list/index"
          options={{
            headerShown: true,
            title: t("manage.myRestaurants"),
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="restaurant/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="restaurant/info/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="restaurant/subscription/index"
          options={{
            headerShown: true,
            title: t("manage.subscription.title"),
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
          name="production/printers/index"
          options={{
            headerShown: true,
            title: t("printers:title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="production/printers/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="production/areas/index"
          options={{
            // The screen draws its own title
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="restaurant/edit/index"
          options={{
            headerShown: true,
            title: t("manage.restaurantInfo"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="restaurant/settings/index"
          options={{
            headerShown: true,
            title: t("manage.restaurantSettings"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="production/areas/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/overview/index"
          options={{
            headerShown: true,
            title: t("menuManagement:overview.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu/sections/index"
          options={{
            headerShown: true,
            title: t("menuManagement:sections.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu/sections/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/sections/categories/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/categories/index"
          options={{
            headerShown: true,
            title: t("menuManagement:categories.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu/categories/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/categories/products/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/products/index"
          options={{
            headerShown: true,
            title: t("menuManagement:products.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="menu/products/detail/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/products/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/products/option-recipe/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="menu/products/variant/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/items/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/items/new-product/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/items/new-quantity/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/items/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/items/list/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/categories/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/categories/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/purchases/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/purchases/items/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/purchases/cart/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/purchases/shopping-list/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/purchases/detail/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/counts/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/counts/items/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/counts/run/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="inventory/counts/detail/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="tables/index"
          options={{
            headerShown: true,
            title: t("tables:settings.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="tables/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="restaurant/create-branch/index"
          options={{
            headerShown: true,
            title: t("auth:createBranch.details.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="restaurant/create-branch/tables"
          options={{
            headerShown: true,
            title: t("auth:createBranch.tables.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="restaurant/create-branch/users"
          options={{
            headerShown: true,
            title: t("auth:createBranch.users.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="tables/areas/index"
          options={{
            headerShown: true,
            title: t("tables:areas.title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="tables/areas/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="tables/reorder/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="payment-methods/index"
          options={{
            headerShown: true,
            title: t("paymentMethods:title"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="payment-methods/account-form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="payment-methods/form/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="account/settings/index"
          options={{
            headerShown: true,
            title: t("manage.settings"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="account/about/index"
          options={{
            headerShown: true,
            title: t("settings.aboutTitle"),
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="account/edit-profile/index"
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

        <Stack.Screen
          name="account/change-password/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="account/set-credentials/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="account/change-email/index"
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

      <ThemedBottomSheetModal ref={bottomSheetModalRef}>
        <NewOrderBottomSheet
          onCreateOrder={closeBottomSheet}
          buttonProps={{ label: "Save changes" }}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
