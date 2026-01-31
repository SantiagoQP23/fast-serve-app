import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Order } from "@/core/orders/models/order.model";
import Card from "@/presentation/theme/components/card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { useTranslation } from "react-i18next";
import ProgressBar from "@/presentation/theme/components/progress-bar";
import { getRelativeTime } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { statusText, statusTextColor, bgColor, statusIcon, statusIconColor } =
    useOrderStatus(order.status);

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
  const relativeTime = getRelativeTime(order.createdAt);

  const openOrder = () => {
    setActiveOrder(order);
    router.push(`/(order)/${order.num}`);
    // router.replace("/(new-order)/order-confirmation", { withAnchor: true });
  };

  return (
    <ThemedView style={tw`mb-3  rounded-2xl  `}>
      <Card onPress={openOrder}>
        <ThemedView style={tw`gap-4 bg-white `}>
          {/* Header Section - Table Name */}
          <ThemedView style={tw`flex-row items-center bg-transparent gap-2`}>
            <ThemedView
              style={tw`gap-1 flex-row items-center ${bgColor}/10 px-3 py-1 rounded-full`}
            >
              <Ionicons
                name={statusIcon}
                size={18}
                color={tw.color(statusIconColor)}
              />
              <ThemedText
                type="body2"
                style={tw`${statusTextColor} font-semibold`}
              >
                {statusText}
              </ThemedText>
            </ThemedView>
            {order.isPaid && (
              <Label text={t("orders:details.paid")} color="success" />
            )}
          </ThemedView>
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <ThemedView
              style={tw`flex-row items-center bg-transparent justify-between`}
            >
              <ThemedText type="h3">
                {order.type === OrderType.IN_PLACE
                  ? `${t("common:labels.table")} ${order.table?.name}`
                  : t("common:labels.takeAway")}{" "}
              </ThemedText>
            </ThemedView>

            {/* Meta Info Row - Time and Waiter */}
            <ThemedView
              style={tw`flex-row items-center bg-transparent gap-1 font-bold`}
            >
              <ThemedText type="small" style={tw`text-gray-500 font-bold`}>
                {relativeTime}{" "}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                •{" "}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500 `}>
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Progress Indicator */}
          {hasDetails &&
            (order.status === OrderStatus.IN_PROGRESS ||
              order.status === OrderStatus.PENDING) && (
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <ThemedView
                  style={tw`flex-row items-center bg-transparent justify-between`}
                >
                  <ThemedText type="caption" style={tw`text-gray-500`}>
                    {t("common:status.delivered")}: {deliveredItems}/
                    {totalItems}
                  </ThemedText>
                  <ThemedText type="caption" style={tw`text-gray-500`}>
                    {Math.round(deliveryProgress * 100)}%
                  </ThemedText>
                </ThemedView>
                <ProgressBar progress={deliveryProgress} height={1.5} />
              </ThemedView>
            )}

          {/* Separator */}
          {/* <ThemedView style={tw`h-px bg-gray-200`} /> */}

          {/* Bottom Metrics Row */}
          <ThemedView
            style={tw`flex-row items-center bg-transparent justify-between`}
          >
            <ThemedView style={tw`flex-row items-center bg-transparent gap-3`}>
              <ThemedText type="body2" style={tw`text-gray-600`}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={tw.color("gray-600")}
                />{" "}
                {order.people}
              </ThemedText>
              {hasDetails && (
                <>
                  <ThemedText type="body2" style={tw`text-gray-600`}>
                    •
                  </ThemedText>
                  <ThemedText type="body2" style={tw`text-gray-600`}>
                    <Ionicons
                      name="cart-outline"
                      size={18}
                      color={tw.color("gray-600")}
                    />{" "}
                    {order.details.length}
                  </ThemedText>
                </>
              )}
              <ThemedText type="body2" style={tw`text-gray-600`}>
                •
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {t("orders:details.orderNumber", { num: order.num })}
              </ThemedText>
            </ThemedView>
            <ThemedText type="h3">${order.total}</ThemedText>
          </ThemedView>
        </ThemedView>
      </Card>
    </ThemedView>
  );
}
