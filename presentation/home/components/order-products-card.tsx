import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { useTranslation } from "react-i18next";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { getRelativeTime } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import OrderDetailCard from "@/presentation/orders/components/order-detail-card";
import { Pressable } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";

interface OrderProductsCardProps {
  order: Order;
}

export default function OrderProductsCard({ order }: OrderProductsCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );
  const { statusText, statusIcon, labelColor } = useOrderStatus(order.status);

  // Calculate delivery progress - handle missing details
  const hasDetails = order.details && order.details.length > 0;
  const totalItems = hasDetails
    ? order.details.reduce((sum, detail) => sum + detail.quantity, 0)
    : 0;
  const deliveredItems = hasDetails
    ? order.details.reduce((sum, detail) => sum + detail.qtyDelivered, 0)
    : 0;
  const deliveryProgress = totalItems > 0 ? deliveredItems / totalItems : 0;

  // Get relative time
  const relativeTime = getRelativeTime(order.deliveryTime);

  const openOrder = () => {
    setActiveOrder(order);
    router.push(`/(order)/${order.num}`);
    // router.replace("/(new-order)/order-confirmation", { withAnchor: true });
  };

  const handleEditOrderDetail = useCallback(
    (orderNum: number, orderId: string, detail: any) => {
      if (order) {
        setActiveOrder(order);
        setActiveOrderDetail(detail);
        router.push(`/(order)/${orderNum}/edit-order-detail`);
      }
    },
    [setActiveOrder, setActiveOrderDetail, router],
  );

  return (
    <ThemedView key={order.id} style={tw`mb-8 bg-light-surface rounded-lg p-4`}>
      <Pressable onPress={() => openOrder()}>
        <ThemedView style={tw`mb-4 bg-transparent`}>
          <ThemedView
            style={tw`flex-row items-center justify-between bg-transparent`}
          >
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <ThemedText type="h3">
                {order.type === OrderType.IN_PLACE
                  ? `${t("common:labels.table")} ${order.table?.name}`
                  : t("common:labels.takeAway")}{" "}
              </ThemedText>
            </ThemedView>
            <IconButton
              variant="text"
              icon="chevron-forward"
              color={tw.color("gray-500")}
              size={20}
              onPress={() => openOrder()}
            />
          </ThemedView>
          <ThemedView style={tw`flex-row items-center gap-2 mt-1`}>
            <ThemedText type="small" style={tw`text-gray-500 `}>
              {relativeTime}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              •
            </ThemedText>

            <Label
              text={statusText}
              color={labelColor}
              leftIcon={statusIcon}
              size="small"
            />

            {order.isPaid && (
              <>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  •
                </ThemedText>
                <Label
                  text={t("orders:details.paid")}
                  color="success"
                  size="small"
                />
              </>
            )}
          </ThemedView>
        </ThemedView>
      </Pressable>
      <ThemedView style={tw`gap-4`}>
        {order.details
          .filter((detail) => detail.quantity !== detail.qtyDelivered)
          .map((detail) => (
            <OrderDetailCard
              key={detail.id}
              detail={detail}
              orderId={order.id}
              orderUserId={order.user.id}
              onPress={() => handleEditOrderDetail(order.num, order.id, detail)}
            />
          ))}
      </ThemedView>

      <ThemedView style={tw`flex-row items-center gap-2 mt-4`}>
        <ThemedText type="small" style={tw`text-gray-500 `}>
          {t("orders:details.orderNumber", {
            num: order.num,
          })}
        </ThemedText>

        <ThemedText type="small" style={tw`text-gray-500`}>
          •
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500 `}>
          {dayjs(order.createdAt).format("HH:mm")}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
