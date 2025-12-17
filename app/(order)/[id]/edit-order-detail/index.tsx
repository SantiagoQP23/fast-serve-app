import { KeyboardAvoidingView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";

export default function EditOrderDetailScreen() {
  const { t } = useTranslation(["common", "orders"]);
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const order = useOrdersStore((state) => state.activeOrder);

  const { counter, increment, decrement } = useCounter(
    orderDetail?.quantity,
    1,
    20,
    orderDetail?.qtyDelivered,
  );

  const {
    counter: deliveredCounter,
    increment: incrementDelivered,
    decrement: decrementDelivered,
  } = useCounter(orderDetail?.qtyDelivered, 1, orderDetail?.quantity, 0);

  const router = useRouter();
  const {
    isOnline,
    isLoading,
    mutate: updateOrderDetail,
  } = useOrders().updateOrderDetail;

  const [withNotes, setWithNotes] = useState(!!orderDetail?.description);
  const [notes, setNotes] = useState(orderDetail?.description || "");
  const [price, setPrice] = useState(orderDetail?.price.toString() || "");

  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  if (!orderDetail) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const onUpdateOrderDetail = () => {
    updateOrderDetail(
      {
        id: orderDetail.id,
        quantity: counter,
        qtyDelivered: deliveredCounter,
        description: withNotes ? notes : undefined,
        price: parseFloat(price),
        orderId: order!.id,
      },
      {
        onSuccess: () => {
          setActiveOrderDetail(null);
          router.back();
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView>
            <ThemedText type="h2">{orderDetail.product.name}</ThemedText>
            <ThemedText type="body1">
              {formatCurrency(orderDetail.price)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        {orderDetail.product.description && (
          <ThemedText type="body2">
            {orderDetail.product.description}
          </ThemedText>
        )}

        <TextInput
          label={t("common:labels.price")}
          keyboardType="numeric"
          icon="pricetag-outline"
          value={price}
          onChangeText={setPrice}
        />
        <ThemedView>
          <Switch
            label={t("orders:newOrder.addNote")}
            value={withNotes}
            onValueChange={setWithNotes}
          />
          {withNotes && (
            <TextInput
              numberOfLines={5}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          )}
        </ThemedView>

        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView>
            <ThemedText type="h4">
              {t("common:status.delivered")}
            </ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row items-center gap-4`}>
            <IconButton
              icon="remove-outline"
              onPress={decrementDelivered}
              variant="outlined"
            />
            <ThemedText>{deliveredCounter}</ThemedText>
            <IconButton
              icon="add"
              onPress={incrementDelivered}
              variant="outlined"
            />
          </ThemedView>
        </ThemedView>
        <ThemedView style={tw`flex-1 `} />
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-xl shadow-xl `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h4">
            {formatCurrency(orderDetail.price * counter)}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center gap-4`}>
            <IconButton
              icon="remove-outline"
              onPress={decrement}
              variant="outlined"
            />
            <ThemedText>{counter}</ThemedText>
            <IconButton icon="add" onPress={increment} variant="outlined" />
          </ThemedView>
        </ThemedView>
        <Button
          label={t("orders:edit.saveChanges")}
          onPress={onUpdateOrderDetail}
          leftIcon="save-outline"
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
