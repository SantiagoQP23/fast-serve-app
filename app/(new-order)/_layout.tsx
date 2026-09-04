import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { Colors } from "@/constants/theme";

export default function NewOrderLayout() {
  const { t } = useTranslation(["common"]);
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const cartType = useNewOrderStore((state) => state.cartType);
  const order = useOrdersStore((state) => state.activeOrder);
  const { details } = useNewOrderStore();

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
        }}
      >
        <Stack.Screen
          name="restaurant-menu/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerRight: () =>
              order ? null : (
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
            headerShadowVisible: false,
            headerRight: () =>
              cartType === "order" && (
                <IconButton
                  icon="create-outline"
                  onPress={handlePresentModalPress}
                ></IconButton>
              ),
          }}
        />
      </Stack>

      <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
        <NewOrderBottomSheet
          onCreateOrder={closeBottomSheet}
          buttonProps={{ label: t("common:actions.saveChanges") }}
        />
      </ThemedBottomSheetModal>
    </>
  );
}
