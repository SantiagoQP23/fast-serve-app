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

export default function RestaurantMenuScreen() {
  const orderDetail = useOrdersStore((state) => state.activeOrderDetail);
  const { counter, increment, decrement } = useCounter(
    orderDetail?.quantity,
    1,
    20,
    1,
  );
  const {
    counter: deliveredCounter,
    increment: incrementDelivered,
    decrement: decrementDelivered,
  } = useCounter(orderDetail?.qtyDelivered, 1, 20, 1);

  const router = useRouter();

  const [withNotes, setWithNotes] = useState(!!orderDetail?.description);
  const [notes, setNotes] = useState(orderDetail?.description || "");
  const [price, setPrice] = useState(orderDetail?.price.toString() || "");

  const setActiveOrderDetail = useOrdersStore(
    (state) => state.setActiveOrderDetail,
  );

  if (!orderDetail) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="h2">No active order detail selected</ThemedText>
      </ThemedView>
    );
  }

  const goToMenu = () => {
    setActiveOrderDetail(null);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView>
            <ThemedText type="h2">{orderDetail.product.name}</ThemedText>
            <ThemedText type="body1">${orderDetail.price}</ThemedText>
          </ThemedView>
        </ThemedView>
        {orderDetail.product.description && (
          <ThemedText type="body2">
            {orderDetail.product.description}
          </ThemedText>
        )}

        <TextInput
          label="Price"
          keyboardType="numeric"
          icon="pricetag-outline"
          value={price}
          onChangeText={setPrice}
        />
        <ThemedView>
          <Switch
            label="Add note"
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
            <ThemedText type="h4">Entregado</ThemedText>
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
          <ThemedText type="h4">${orderDetail.price * counter}</ThemedText>
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
          label="Save changes"
          onPress={goToMenu}
          leftIcon="save-outline"
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
