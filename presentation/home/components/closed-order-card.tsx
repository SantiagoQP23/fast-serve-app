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
import { getRelativeTime } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";

interface ClosedOrderCardProps {
  order: Order;
}

export default function ClosedOrderCard({ order }: ClosedOrderCardProps) {
  const { t } = useTranslation(["common", "orders"]);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const { statusText, statusTextColor, bgColor, statusIcon, statusIconColor } =
    useOrderStatus(order.status);

  // Get relative time
  const relativeTime = getRelativeTime(order.createdAt);

  const openOrder = () => {
    setActiveOrder(order);
    router.push(`/(order)/${order.num}`);
  };

  return (
    <ThemedView style={tw`mb-3 rounded-2xl opacity-75`}>
      <Card onPress={openOrder}>
        <ThemedView style={tw`gap-4 bg-white`}>
          {/* Header Section - Status & Payment */}
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
            {/* Closed badge */}
            <ThemedView
              style={tw`gap-1 flex-row items-center bg-gray-500/10 px-3 py-1 rounded-full`}
            >
              <Ionicons
                name="archive-outline"
                size={16}
                color={tw.color("gray-600")}
              />
              <ThemedText type="body2" style={tw`text-gray-600 font-semibold`}>
                {t("common:labels.closed")}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Table/Type Info */}
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
            <ThemedText type="small" style={tw`text-gray-500`}>
              {relativeTime} • {order.user.person.firstName}{" "}
              {order.user.person.lastName}
            </ThemedText>
          </ThemedView>

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
