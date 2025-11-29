import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const goToHome = () => {
    router.replace("/(tabs)");
    setActiveOrder(null);
  };

  if (!order) {
    return null;
  }

  const { statusText } = useOrderStatus(order?.status);

  return (
    <>
      <ThemedView
        style={tw`px-4 pt-8 flex-1 gap-8 items-center justify-center`}
      >
        <ThemedView style={tw` items-center gap-2`}>
          <ThemedText type="h1">Order Confirmed</ThemedText>
          <ThemedText type="body1">The new order has been created</ThemedText>
        </ThemedView>
        <ThemedView style={tw` w-full   rounded-lg gap-4`}>
          <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg`}>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">
                {order.type === OrderType.IN_PLACE
                  ? `Table: ${order.table?.name}`
                  : "Take Away"}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">Waiter:</ThemedText>
              <ThemedText type="body1">
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">People:</ThemedText>
              <ThemedText type="body1">{order.people}</ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">Status:</ThemedText>
              <ThemedText type="body1">{statusText}</ThemedText>
            </ThemedView>
          </ThemedView>

          {order.notes && (
            <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg`}>
              <ThemedView style={tw`  bg-transparent gap-2 `}>
                <ThemedText type="body2">Notes</ThemedText>
                <ThemedText type="body1">
                  {order.notes || "No notes"}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          )}
          <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg gap-2`}>
            {order.details.map((item, index) => (
              <ThemedView
                style={tw`flex-row justify-between items-center bg-transparent `}
                key={index}
              >
                <ThemedView
                  style={tw`flex-row items-center bg-transparent gap-3 `}
                >
                  <ThemedText type="body1">{item.quantity}</ThemedText>
                  <ThemedText type="body1">{item.product.name}</ThemedText>
                </ThemedView>
                <ThemedText type="body1">${item.amount}</ThemedText>
              </ThemedView>
            ))}
            <ThemedView
              style={tw`flex-row justify-between items-center bg-transparent `}
            >
              <ThemedText type="h4">Total</ThemedText>
              <ThemedText type="body1" style={tw`font-bold`}>
                ${order.total}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        <ThemedView style={tw`w-full flex-row gap-4 justify-center`}>
          <Button
            leftIcon="home-outline"
            label="Go to home"
            onPress={goToHome}
            variant="outline"
          ></Button>
          <Button
            leftIcon="pencil-outline"
            label="Edit order"
            onPress={() => router.push("/(order)/[id]")}
            variant="primary"
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
