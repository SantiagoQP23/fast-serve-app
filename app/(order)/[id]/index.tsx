import { ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import NewOrderDetailCard from "@/presentation/orders/components/new-order-detail-card";
import IconButton from "@/presentation/theme/components/icon-button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";

dayjs.extend(relativeTime);

export default function OrderScreen() {
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const router = useRouter();

  const openProduct = (detail: OrderDetail) => {
    setActiveOrderDetail(detail);
    router.push("/(order)/edit-order-detail");
  };

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">No active order selected</ThemedText>
      </ThemedView>
    );
  }

  const { statusText, statusTextColor, statusIcon } = useOrderStatus(
    order.status,
  );

  const date = dayjs(order.createdAt).isSame(dayjs(), "day")
    ? `Today, ${dayjs(order.createdAt).format("HH:mm")}`
    : dayjs(order.createdAt).format("dddd, HH:mm");

  const relativeDate = dayjs(order.createdAt).fromNow(true);

  return (
    <>
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView
          style={tw` justify-between bg-gray-100 p-4 rounded-lg gap-4`}
        >
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText type="h3">
              {order.type === OrderType.IN_PLACE
                ? `Table ${order.table?.name}`
                : "Take Away"}
            </ThemedText>
            <ThemedView
              style={tw` flex-row  bg-transparent items-center gap-2`}
            >
              <Ionicons name="people-outline" size={18} />
              <ThemedText type="body2">{order.people}</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedView style={tw`border border-dashed border-gray-700`} />
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText type="h4">Order {order.num}</ThemedText>
            <ThemedText type="body2">
              {date} - {relativeDate}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
        >
          {order.notes && (
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="caption">Notes</ThemedText>
              <ThemedText type="body2">{order.notes}</ThemedText>
            </ThemedView>
          )}
          <ThemedView style={tw`flex-row justify-between items-center`}>
            {order.status === OrderStatus.IN_PROGRESS && (
              <Button
                label="Pause"
                variant="outline"
                rightIcon="pause-outline"
                size="small"
              />
            )}
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons name={statusIcon} size={18} color={statusTextColor} />
              <ThemedText type="h3" style={tw``}>
                {statusText}
              </ThemedText>
            </ThemedView>
            {order.status === OrderStatus.IN_PROGRESS && (
              <Button
                label="Deliver"
                variant="outline"
                rightIcon="checkmark-done-outline"
                size="small"
              />
            )}
            {order.status === OrderStatus.PENDING && (
              <Button
                label="Start"
                variant="outline"
                rightIcon="play-outline"
                size="small"
              />
            )}
          </ThemedView>
          {order.details.map((detail, index) => (
            <OrderDetailCard
              key={index}
              detail={detail}
              onPress={() => openProduct(detail)}
            />
          ))}
        </ScrollView>
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-lg `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">Total</ThemedText>
          <ThemedText type="h2">${order.total}</ThemedText>
        </ThemedView>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <IconButton
            icon="trash-outline"
            onPress={() => {}}
            color="danger"
            disabled
          />
          <Button
            label="Payments"
            variant="secondary"
            onPress={() => router.push(`/(order)/${"sd"}/bills`)}
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
