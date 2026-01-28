import {
  ScrollView,
  View,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import Label from "@/presentation/theme/components/label";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import { useOrder } from "@/presentation/orders/hooks/useOrder";
import { useBills } from "@/presentation/orders/hooks/useBills";
import Button from "@/presentation/theme/components/button";
import {
  getPaymentMethodIcon,
  translatePaymentMethod,
} from "@/core/i18n/utils";

dayjs.extend(relativeTime);

export default function ViewOrderScreen() {
  const { t } = useTranslation(["common", "orders", "errors", "bills"]);
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  // Get order ID from route params
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch order data using the order ID
  const {
    isLoading: isLoadingOrder,
    isError: isOrderError,
    isRefetching,
  } = useOrder(id || null);

  // Get order from store after it's been fetched
  const order = useOrdersStore((state) => state.activeOrder);

  // Fetch bills for this order
  const { billsByOrderQuery } = useBills();
  const {
    data: bills,
    isLoading: isLoadingBills,
    refetch: refetchBills,
  } = billsByOrderQuery(id || "");

  // Update header title dynamically with order number
  useEffect(() => {
    if (order) {
      navigation.setOptions({
        title: t("orders:details.orderNumber", { num: order.num }),
      });
    }
  }, [navigation, order?.num, t]);

  // Call all hooks before any conditional returns
  const { statusText, statusTextColor, statusIcon, statusIconColor, bgColor } =
    useOrderStatus(order?.status || OrderStatus.PENDING);

  const onRefresh = useCallback(async () => {
    if (!id) return;

    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch the specific order and bills
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["order", id],
        }),
        refetchBills(),
      ]);
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [id, queryClient, refetchBills, t]);

  // Early return after all hooks have been called
  if (!id) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:viewOrder.noOrder")}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-2 text-center`}>
          {t("orders:viewOrder.noOrderDescription")}
        </ThemedText>
      </ThemedView>
    );
  }

  // Show loading state while fetching order details
  if (isLoadingOrder && !order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("common:status.loading")}</ThemedText>
      </ThemedView>
    );
  }

  // Show error state if order not found
  if (isOrderError || !order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center px-6`}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={tw.color("gray-300")}
        />
        <ThemedText type="h2" style={tw`mt-4`}>
          {t("orders:viewOrder.noOrder")}
        </ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 mt-2 text-center`}>
          {t("orders:viewOrder.noOrderDescription")}
        </ThemedText>
        <Button
          label={t("common:actions.goBack")}
          onPress={() => router.back()}
          variant="outline"
          style={tw`mt-6`}
        />
      </ThemedView>
    );
  }

  // Non-hook functions and computed values
  const date = dayjs(order.createdAt).isSame(dayjs(), "day")
    ? `${t("common:time.today")}, ${dayjs(order.createdAt).format("HH:mm")}`
    : dayjs(order.createdAt).format("dddd, HH:mm");

  // For view-only, show all items together
  const hasDetails = order.details && Array.isArray(order.details);
  const allDetails = hasDetails ? order.details : [];
  const hasItems = allDetails.length > 0;

  // Check if order has bills
  const hasBills = bills && bills.length > 0;

  const handleViewBills = () => {
    router.push(`/(order)/${order.num}/bills`);
  };

  return (
    <>
      <ThemedView style={tw`px-4 pt-6 flex-1`}>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
        >
          {/* Header Section */}
          <ThemedView style={tw`mb-6 gap-4`}>
            {/* Date */}
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {date}
            </ThemedText>

            {/* Table/Location & People */}
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name={
                  order.type === OrderType.IN_PLACE
                    ? "restaurant-outline"
                    : "bag-outline"
                }
                size={24}
                color={tw.color("primary-600")}
              />
              <ThemedText type="h2">
                {order.type === OrderType.IN_PLACE
                  ? `${t("common:labels.table")} ${order.table?.name}`
                  : t("common:labels.takeAway")}
              </ThemedText>
              <ThemedView style={tw`flex-row items-center gap-1 ml-2`}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={tw.color("gray-600")}
                />
                <ThemedText type="body2" style={tw`text-gray-600`}>
                  {order.people}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Status & Payment Labels */}
            <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
              <ThemedView
                style={tw`flex-row items-center gap-1.5 ${bgColor}/10 px-3 py-1.5 rounded-full`}
              >
                <Ionicons
                  name={statusIcon}
                  size={16}
                  color={tw.color(statusIconColor)}
                />
                <ThemedText
                  type="small"
                  style={tw`${statusTextColor} font-semibold`}
                >
                  {statusText}
                </ThemedText>
              </ThemedView>
              {order.isPaid ? (
                <Label text={t("orders:details.paid")} color="success" />
              ) : (
                <Label text={t("orders:details.unpaid")} color="warning" />
              )}
              {/* View Only Badge */}
              <ThemedView
                style={tw`flex-row items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full`}
              >
                <Ionicons
                  name="eye-outline"
                  size={16}
                  color={tw.color("gray-600")}
                />
                <ThemedText
                  type="small"
                  style={tw`text-gray-700 font-semibold`}
                >
                  {t("orders:viewOrder.viewOnly")}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Waiter Info */}
            <ThemedView
              style={tw`flex-row items-center gap-2 pt-2 border-t border-gray-200`}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={tw.color("gray-500")}
              />
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Notes Section */}
          {order.notes && (
            <ThemedView style={tw`mb-6 p-4 bg-gray-50 rounded-xl`}>
              <ThemedView style={tw`flex-row items-center gap-2 mb-2`}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={tw.color("gray-500")}
                />
                <ThemedText
                  type="caption"
                  style={tw`text-gray-500 font-semibold`}
                >
                  {t("common:labels.notes")}
                </ThemedText>
              </ThemedView>
              <ThemedText type="body2" style={tw`text-gray-700`}>
                {order.notes}
              </ThemedText>
            </ThemedView>
          )}

          {/* All Items Section */}
          {hasItems && (
            <ThemedView style={tw`mb-6`}>
              <ThemedView
                style={tw`flex-row justify-between items-center mb-4`}
              >
                <ThemedText type="h4">
                  {t("orders:details.allItems")}
                </ThemedText>
                <ThemedView style={tw`bg-gray-100 px-2.5 py-1 rounded-full`}>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-700 font-semibold`}
                  >
                    {allDetails.length}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw`gap-3`}>
                {allDetails.map((detail) => (
                  <ThemedView
                    key={detail.id}
                    style={tw`flex-row items-start gap-3 py-2`}
                  >
                    <ThemedText type="body1" style={tw`text-gray-700 font-semibold min-w-8`}>
                      {detail.quantity}x
                    </ThemedText>
                    <ThemedView style={tw`flex-1`}>
                      <ThemedText type="body1" style={tw`text-gray-900`}>
                        {detail.product.name}
                      </ThemedText>
                      {detail.description && (
                        <ThemedText type="small" style={tw`text-gray-500 mt-1`}>
                          {detail.description}
                        </ThemedText>
                      )}
                    </ThemedView>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {/* Empty state for orders with no items */}
          {!hasItems && (
            <ThemedView style={tw`mb-6 p-8 items-center justify-center`}>
              <Ionicons
                name="document-outline"
                size={48}
                color={tw.color("gray-300")}
              />
              <ThemedText type="body1" style={tw`text-gray-500 mt-4 text-center`}>
                {t("orders:details.noItemsInOrder")}
              </ThemedText>
            </ThemedView>
          )}

          {/* Bills Section */}
          {hasBills && (
            <ThemedView style={tw`mb-6`}>
              <ThemedView
                style={tw`flex-row justify-between items-center mb-4`}
              >
                <ThemedText type="h4">{t("bills:list.bills")}</ThemedText>
                <ThemedView style={tw`bg-gray-100 px-2.5 py-1 rounded-full`}>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-700 font-semibold`}
                  >
                    {bills.length}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={tw`gap-3`}>
                {bills.map((bill) => (
                  <Pressable
                    key={bill.id}
                    onPress={() =>
                      router.push(`/(order)/${order.num}/bills/${bill.id}`)
                    }
                  >
                    <ThemedView
                      style={tw`flex-row items-center justify-between p-4 bg-gray-50 rounded-xl`}
                    >
                      {/* Left: Icon + Bill info */}
                      <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                        {/* Payment method icon */}
                        <ThemedView
                          style={tw`w-10 h-10 rounded-full ${
                            bill.isPaid ? "bg-green-50" : "bg-orange-50"
                          } items-center justify-center`}
                        >
                          <Ionicons
                            name={
                              bill.isPaid
                                ? getPaymentMethodIcon(bill.paymentMethod)
                                : "time-outline"
                            }
                            size={20}
                            color={
                              bill.isPaid
                                ? tw.color("green-600")
                                : tw.color("orange-600")
                            }
                          />
                        </ThemedView>

                        {/* Bill details */}
                        <ThemedView style={tw`flex-1`}>
                          <ThemedText type="body1" style={tw`font-semibold`}>
                            {t("bills:list.billNumber", { number: bill.num })}
                          </ThemedText>
                          <ThemedView
                            style={tw`flex-row items-center gap-1.5 mt-0.5`}
                          >
                            {bill.isPaid && (
                              <ThemedText type="small" style={tw`text-gray-500`}>
                                {translatePaymentMethod(bill.paymentMethod)}
                              </ThemedText>
                            )}
                            {!bill.isPaid && (
                              <ThemedText type="small" style={tw`text-orange-600`}>
                                {t("bills:details.unpaid")}
                              </ThemedText>
                            )}
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>

                      {/* Right: Amount */}
                      <ThemedView style={tw`items-end`}>
                        <ThemedText
                          type="body1"
                          style={tw`font-semibold ${
                            bill.isPaid ? "text-green-700" : "text-orange-700"
                          }`}
                        >
                          {formatCurrency(bill.total)}
                        </ThemedText>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={tw.color("gray-400")}
                        />
                      </ThemedView>
                    </ThemedView>
                  </Pressable>
                ))}
              </ThemedView>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>

      {/* Footer - Total */}
      <ThemedView style={tw`px-4 py-4 border-t border-gray-200 bg-white`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h4" style={tw`text-gray-600`}>
            {t("common:labels.total")}
          </ThemedText>
          <ThemedText type="h2" style={tw`text-primary-700`}>
            {formatCurrency(order.total)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </>
  );
}
