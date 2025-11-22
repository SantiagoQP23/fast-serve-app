import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import IconButton from "@/presentation/theme/components/icon-button";
import NotificationBadge from "@/presentation/theme/components/notification-badge";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, Stack } from "expo-router";
import { useCallback, useRef } from "react";

export default function NewOrderLayout() {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="restaurant-menu/index"
          options={{
            headerShown: true,
            title: "",
            headerShadowVisible: false,
            headerRight: () => (
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
            headerRight: () => (
              <IconButton
                icon="create-outline"
                onPress={handlePresentModalPress}
              ></IconButton>
            ),
          }}
        />
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
