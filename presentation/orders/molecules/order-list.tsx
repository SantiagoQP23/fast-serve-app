import { Order } from "@/core/orders/models/order.model";
import OrderCard from "@/presentation/home/components/order-card";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { FlatList, useWindowDimensions } from "react-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { CAROUSEL_CARD_MAX_WIDTH } from "@/constants/breakpoints";

export interface OrderListProps {
  orders: Order[];
  title: string;
}
export default function OrderList({ title, orders }: OrderListProps) {
  const { t } = useTranslation(["common"]);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth * 0.85, CAROUSEL_CARD_MAX_WIDTH);
  return (
    <>
      <ThemedView>
        <ThemedView style={tw`px-4 justify-between mb-4`}>
          <ThemedText type="h4">{title}</ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("common:labels.count")}: {orders.length}
          </ThemedText>
        </ThemedView>
        <FlatList
          data={orders}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ThemedView
              style={[
                index !== orders.length - 1 && tw`mr-4`,
                { width: cardWidth },
              ]}
            >
              <OrderCard order={item} />
            </ThemedView>
          )}
          style={tw`pr-4`}
          contentContainerStyle={tw`px-4`}
        />
      </ThemedView>
    </>
  );
}
