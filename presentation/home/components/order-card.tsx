import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { View, Pressable } from "react-native";
import dayjs from "dayjs";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const status = order.status || OrderStatus.PENDING;
  const { statusText, statusTextColor, statusBackgroundColor } = useOrderStatus(
    order.status,
  );

  const date = dayjs(order.createdAt).isSame(dayjs(), "day")
    ? `Today, ${dayjs(order.createdAt).format("HH:mm")}`
    : dayjs(order.createdAt).format("dddd, HH:mm");

  const openOrder = () => {
    // router.push(`/(order)/${order.num}`);
    router.replace("/(new-order)/order-confirmation", { withAnchor: true });
    setActiveOrder(order);
  };

  return (
    <ThemedView style={tw`mb-3  rounded-2xl `}>
      <Card onPress={openOrder}>
        <ThemedView style={tw`gap-3 bg-transparent`}>
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedView
              style={tw`flex-row items-center bg-transparent justify-between`}
            >
              <ThemedView style={tw`gap-1 bg-transparent`}>
                <ThemedText type="h4" style={tw``}>
                  {order.user.person.firstName} {order.user.person.lastName}
                </ThemedText>
              </ThemedView>
              <ThemedView
                style={tw` flex-row justify-end bg-transparent items-center gap-2  rounded-full `}
              >
                <View
                  style={[
                    tw`w-2 h-2 rounded-full `,
                    tw`${statusBackgroundColor}`,
                  ]}
                />
                <ThemedText
                  type="caption"
                  style={[tw`font-semibold`, tw`${statusTextColor}`]}
                >
                  {statusText}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedText type="small">{date}</ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center bg-transparent gap-5 `}>
            <ThemedText type="h3">
              {order.type === OrderType.IN_PLACE
                ? `Table ${order.table?.name}`
                : "Take Away"}
            </ThemedText>
            <ThemedView
              style={tw` flex-row justify-end bg-transparent items-center gap-2`}
            >
              <Ionicons name="people-outline" size={18} />
              <ThemedText type="body2">{order.people}</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView
            style={tw`flex-row items-center bg-transparent justify-between `}
          >
            <ThemedText type="body2">Order N° {order.num} </ThemedText>
            <ThemedText type="h3">${order.total}</ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
