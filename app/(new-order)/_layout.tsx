import CartOptionsBottomSheet, {
  type CartOptionsBottomSheetRef,
} from "@/presentation/orders/components/cart-options-bottom-sheet";
import CartActionsSheets, {
  type CartActionsSheetsRef,
} from "@/presentation/orders/components/cart-actions-sheets";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

import { Stack, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { usePalette } from "@/presentation/theme/store/useThemeStore";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";

export default function NewOrderLayout() {
  const palette = usePalette();
  const { t } = useTranslation(["common", "menu", "orders"]);
  const cartOptionsSheetRef = useRef<CartOptionsBottomSheetRef>(null);
  const order = useOrdersStore((state) => state.activeOrder);
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const isEditMode = !!editOrderId && editOrderId === order?.id;
  const isSaleEditMode = useEditSaleStore((state) => state.billId !== null);
  const cartActionsRef = useRef<CartActionsSheetsRef>(null);

  const handlePresentModalPress = useCallback(() => {
    cartOptionsSheetRef.current?.present();
  }, []);

  const { isExpanded } = useResponsiveLayout();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canEditMenu = isAdminLevelRole(user?.role?.name);

  // Options for the draft being built: turn it into a sale or an order, or
  // clear it. Not while adding to an existing order.
  const renderCartActions = () =>
    !isEditMode &&
    !isSaleEditMode && (
      <ThemedView style={tw`flex-row items-center gap-2`}>
        <IconButton
          icon="ellipsis-vertical"
          accessibilityLabel={t("orders:draft.options")}
          onPress={() => cartActionsRef.current?.present()}
        />
        {/* <IconButton */}
        {/*   icon="square-pen" */}
        {/*   onPress={handlePresentModalPress} */}
        {/*   size={18} */}
        {/*   style={tw`bg-surface p-2`} */}
        {/* ></IconButton> */}
      </ThemedView>
    );

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
          name="restaurant-menu/index"
          options={{
            headerShown: true,
            title: t("menu:title"),
            headerShadowVisible: false,
            // On phones the cart bar docked above the search leads to the
            // cart; beside the side-pane cart, offer its actions here.
            headerRight: () => (
              <ThemedView style={tw`flex-row items-center gap-2`}>
                {canEditMenu && (
                  <Button
                    label={t("common:actions.edit")}
                    variant="surface"
                    size="extra-small"
                    onPress={() => router.push("/(profile)/menu/overview")}
                  />
                )}
                {!order && !isSaleEditMode && isExpanded && renderCartActions()}
              </ThemedView>
            ),
          }}
        />
        {/* Host for a native bottom sheet over the menu: the screen itself is
            transparent and doesn't animate, the sheet brings its own. */}
        <Stack.Screen
          name="restaurant-menu/product/index"
          options={{
            presentation: "transparentModal",
            animation: "none",
          }}
        />
        <Stack.Screen
          name="cart/index"
          options={{
            headerShown: true,
            title: "",
            // headerLargeTitle: true,
            // headerTitle: "cart",
            // headerBlurEffect: "systemChromeMaterialLight",
            headerShadowVisible: false,
            // headerLargeTitleShadowVisible: true,
            headerRight: renderCartActions,
          }}
        />
      </Stack>

      <CartActionsSheets ref={cartActionsRef} />
      <CartOptionsBottomSheet ref={cartOptionsSheetRef} />
    </>
  );
}
