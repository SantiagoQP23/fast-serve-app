import React, { useState } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Dimensions, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Order } from "@/core/orders/models/order.model";
import ClosedOrderCard from "@/presentation/home/components/closed-order-card";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";

interface CollapsibleOrderSectionProps {
  title: string;
  totalCount: number;
  orders: Order[];
  isLoading: boolean;
  onExpand: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function CollapsibleOrderSection({
  title,
  totalCount,
  orders,
  isLoading,
  onExpand,
  hasMore,
  onLoadMore,
}: CollapsibleOrderSectionProps) {
  const { t } = useTranslation(["common", "orders"]);
  const [isExpanded, setIsExpanded] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const handleToggle = () => {
    if (!isExpanded && orders.length === 0 && !isLoading) {
      onExpand(); // Trigger data fetch on first expand
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <ThemedView style={tw`mb-4`}>
      {/* Header */}
      <Pressable onPress={handleToggle}>
        <ThemedView
          style={tw`px-4 flex-row items-center justify-between py-3 bg-gray-50 dark:bg-gray-800 rounded-lg mx-4`}
        >
          <ThemedView style={tw`flex-1`}>
            <ThemedText type="h4">{title}</ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("common:labels.count")}: {totalCount}
            </ThemedText>
          </ThemedView>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={tw.color("gray-500")}
          />
        </ThemedView>
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <ThemedView style={tw`mt-4`}>
          {isLoading && orders.length === 0 ? (
            <ThemedView style={tw`py-8 items-center`}>
              <ActivityIndicator size="large" />
              <ThemedText type="body2" style={tw`mt-2 text-gray-500`}>
                {t("common:labels.loading")}
              </ThemedText>
            </ThemedView>
          ) : orders.length > 0 ? (
            <>
              <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <ThemedView
                    style={[
                      index !== orders.length - 1 && tw`mr-4`,
                      { width: screenWidth * 0.85 },
                    ]}
                  >
                    <ClosedOrderCard order={item} />
                  </ThemedView>
                )}
                style={tw`pr-4`}
                contentContainerStyle={tw`px-4`}
              />
              
              {/* Load More Button */}
              {hasMore && (
                <ThemedView style={tw`px-4 mt-4`}>
                  <Button
                    label={
                      isLoading
                        ? t("common:labels.loading")
                        : t("common:actions.loadMore")
                    }
                    onPress={onLoadMore}
                    variant="outline"
                    disabled={isLoading}
                  />
                </ThemedView>
              )}
            </>
          ) : (
            <ThemedView style={tw`py-8 items-center`}>
              <Ionicons
                name="archive-outline"
                size={60}
                color={tw.color("gray-400")}
              />
              <ThemedText type="body2" style={tw`mt-2 text-gray-500`}>
                {t("orders:list.noClosedOrders")}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}
