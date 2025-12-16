import { ScrollView, View } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Fab from "@/presentation/theme/components/fab";
import OrderList from "@/presentation/orders/molecules/order-list";
import { useTableOrders } from "@/presentation/orders/hooks/useTableOrders";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useCallback, useRef } from "react";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";

export default function TableOrdersScreen() {
  const { tableId, tableName } = useLocalSearchParams<{
    tableId: string;
    tableName: string;
  }>();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const {
    pendingOrders,
    inProgressOrders,
    deliveredOrders,
    totalAmount,
    activeOrdersCount,
    hasOrders,
  } = useTableOrders(tableId!);

  const { setTable, setOrderType } = useNewOrderStore();

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close();
    router.push("/restaurant-menu");
  };

  const handlePresentModalPress = useCallback(() => {
    // Set the table info for new order
    setTable({ id: tableId!, name: tableName!, isAvailable: false });
    setOrderType(OrderType.IN_PLACE);
    bottomSheetModalRef.current?.present();
  }, [tableId, tableName, setTable, setOrderType]);

  return (
    <>
      <ThemedView style={tw` pt-8 flex-1`}>
        <ThemedView style={tw`mb-6 px-4`}>
          <ThemedText type="h1">Table {tableName}</ThemedText>
          <ThemedView style={tw`flex-row items-center mt-4 gap-4`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <View
                style={[
                  tw`w-3 h-3 rounded-full`,
                  hasOrders ? tw`bg-black` : tw`border border-black-500`,
                ]}
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {hasOrders ? "Occupied" : "Available"}
              </ThemedText>
            </ThemedView>
            {hasOrders && (
              <>
                <ThemedView style={tw`flex-row items-center gap-1`}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={tw.color("gray-600")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-600`}>
                    {activeOrdersCount} active
                  </ThemedText>
                </ThemedView>
                <ThemedView style={tw`flex-row items-center gap-1`}>
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={tw.color("gray-600")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-600`}>
                    ${totalAmount.toFixed(2)}
                  </ThemedText>
                </ThemedView>
              </>
            )}
          </ThemedView>
        </ThemedView>

        {!hasOrders ? (
          <ThemedView style={tw`items-center justify-center flex-1 gap-4`}>
            <Ionicons
              name="restaurant-outline"
              size={80}
              color={tw.color("gray-500")}
            />
            <ThemedText type="h3">No orders yet</ThemedText>
            <ThemedText type="body2" style={tw`text-center max-w-xs`}>
              This table has no orders. Create a new order to get started.
            </ThemedText>
          </ThemedView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`pb-20`}
          >
            <OrderList title="Pending" orders={pendingOrders} />
            <OrderList title="In Progress" orders={inProgressOrders} />
            <OrderList title="Delivered" orders={deliveredOrders} />
          </ScrollView>
        )}

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
          <NewOrderBottomSheet onCreateOrder={handleNavigate} />
        </BottomSheetModal>
      </ThemedView>
      <Fab icon="add-outline" onPress={handlePresentModalPress} />
    </>
  );
}
