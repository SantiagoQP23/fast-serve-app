import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useOrderStatus } from "@/presentation/orders/hooks/useOrderStatus";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { OrderStatus } from "@/core/orders/enums/order-status.enum";

export default function OrderConfirmationScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const goToHome = () => {
    router.replace("/(tabs)");
    setActiveOrder(null);
  };

  const { statusText } = useOrderStatus(order?.status || OrderStatus.PENDING);

  if (!order) {
    return null;
  }

  return (
    <>
      <ThemedView
        style={tw`px-4 pt-8 flex-1 gap-8 items-center justify-center`}
      >
        <ThemedView style={tw` items-center gap-2`}>
          <ThemedText type="h1">{t("orders:confirmation.title")}</ThemedText>
          <ThemedText type="body1">
            {t("orders:confirmation.message")}
          </ThemedText>
        </ThemedView>
        <ThemedView style={tw` w-full   rounded-lg gap-4`}>
          <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg`}>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">
                {order.type === OrderType.IN_PLACE
                  ? `${t("orders:confirmation.table")} ${order.table?.name}`
                  : t("common:labels.takeAway")}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">
                {t("orders:confirmation.waiter")}
              </ThemedText>
              <ThemedText type="body1">
                {order.user.person.firstName} {order.user.person.lastName}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">
                {t("orders:confirmation.people")}
              </ThemedText>
              <ThemedText type="body1">{order.people}</ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`flex-row  items-center bg-transparent gap-2 `}
            >
              <ThemedText type="body1">
                {t("orders:confirmation.status")}
              </ThemedText>
              <ThemedText type="body1">{statusText}</ThemedText>
            </ThemedView>
          </ThemedView>

          {order.notes && (
            <ThemedView style={tw` w-full bg-gray-100 p-4 rounded-lg`}>
              <ThemedView style={tw`  bg-transparent gap-2 `}>
                <ThemedText type="body2">{t("common:labels.notes")}</ThemedText>
                <ThemedText type="body1">
                  {order.notes || t("common:labels.noNotes")}
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
                <ThemedText type="body1">
                  {formatCurrency(item.amount)}
                </ThemedText>
              </ThemedView>
            ))}
            <ThemedView
              style={tw`flex-row justify-between items-center bg-transparent `}
            >
              <ThemedText type="h4">
                {t("orders:confirmation.total")}
              </ThemedText>
              <ThemedText type="body1" style={tw`font-bold`}>
                {formatCurrency(order.total)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        <ThemedView style={tw`w-full flex-row gap-4 justify-center`}>
          <Button
            leftIcon="home-outline"
            label={t("orders:confirmation.goToHome")}
            onPress={goToHome}
            variant="outline"
          ></Button>
          <Button
            leftIcon="pencil-outline"
            label={t("orders:confirmation.editOrder")}
            onPress={() => router.push("/(order)/[id]")}
            variant="primary"
          ></Button>
        </ThemedView>
      </ThemedView>
    </>
  );
}
