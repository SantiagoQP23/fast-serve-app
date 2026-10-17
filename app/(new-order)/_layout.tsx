import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useEditSaleStore } from "@/presentation/orders/store/editSaleStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import IconButton from "@/presentation/theme/components/icon-button";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { ROUTES } from "@/constants/routes";

import { router, Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { typography } from "@/constants/theme";
import { useResponsiveLayout } from "@/presentation/shared/hooks/useResponsiveLayout";
import { usePalette } from "@/presentation/theme/store/useThemeStore";

export default function NewOrderLayout() {
  const palette = usePalette();
  const { t } = useTranslation(["common", "menu"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const cartType = useNewOrderStore((state) => state.cartType);
  const order = useOrdersStore((state) => state.activeOrder);
  const { details } = useNewOrderStore();
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const isEditMode = !!editOrderId && editOrderId === order?.id;
  const isSaleEditMode = useEditSaleStore((state) => state.billId !== null);

  const [resetCartDialogVisible, setResetCartDialogVisible] = useState(false);
  const openResetCartDialog = () => setResetCartDialogVisible(true);
  const closeResetCartDialog = () => setResetCartDialogVisible(false);
  const handleResetCart = () => {
    resetNewOrder();
    closeResetCartDialog();
    router.replace(ROUTES.APP.MY_ORDERS);
  };

  const closeBottomSheet = () => {
    bottomSheetModalRef.current?.close(); // Close sheet before navigating
  };

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const { isExpanded } = useResponsiveLayout();

  const renderCartActions = () =>
    cartType === "order" &&
    !isEditMode && (
      <ThemedView style={tw`flex-row items-center gap-2`}>
        <Button
          variant="surface"
          leftIcon="trash-outline"
          size="extra-small"
          label={t("orders:newOrder.resetCart")}
          onPress={openResetCartDialog}
          disabled={details.length === 0}
        />
        <IconButton
          icon="create-outline"
          onPress={handlePresentModalPress}
          size={18}
          style={tw`bg-surface p-2`}
        ></IconButton>
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
            headerRight: () =>
              order || isSaleEditMode ? null : isExpanded ? (
                // Cart is shown beside the menu, so offer its actions here
                renderCartActions()
              ) : (
                <ThemedView style={tw`relative`}>
                  <IconButton
                    icon="cart-outline"
                    onPress={() => router.push("/(new-order)/cart")}
                  />
                  {details.length ? (
                    <NotificationBadge value={details.length} />
                  ) : (
                    <></>
                  )}
                </ThemedView>
              ),
          }}
        />
        <Stack.Screen
          name="restaurant-menu/product/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,

            headerLeft: () => (
              <IconButton
                icon="arrow-back"
                onPress={() => {
                  setActiveProduct(null);
                  setActiveDetail(null);
                  router.back();
                }}
              />
            ),
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

      <DialogModal
        visible={resetCartDialogVisible}
        title={t("orders:dialogs.resetCartTitle")}
        message={t("orders:dialogs.resetCartMessage")}
        onConfirm={handleResetCart}
        onCancel={closeResetCartDialog}
        confirmLabel={t("common:actions.clear")}
        confirmVariant="destructive"
      />

      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <NewOrderBottomSheet
          onCreateOrder={closeBottomSheet}
          buttonProps={{ label: t("common:actions.saveChanges") }}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
