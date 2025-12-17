import { Platform, StyleSheet, ScrollView, Text } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import OrderCard from "@/presentation/home/components/order-card";
import ProductCard from "@/presentation/restaurant-menu/product-card";
import ButtonGroup from "@/presentation/theme/components/button-group";
import { useState } from "react";
import Chip from "@/presentation/theme/components/chip";
import { router, useRouter } from "expo-router";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";

export default function ProductScreen() {
  const { t } = useTranslation(["menu", "orders"]);
  const activeOrderDetail = useNewOrderStore((state) => state.activeDetail);
  const { counter, increment, decrement } = useCounter(
    activeOrderDetail?.quantity,
    1,
    20,
    1,
  );
  const [withNotes, setWithNotes] = useState(!!activeOrderDetail?.description);
  const { activeProduct } = useMenuStore();
  const [notes, setNotes] = useState(activeOrderDetail?.description || "");

  const addDetail = useNewOrderStore((state) => state.addDetail);
  const updateDetail = useNewOrderStore((state) => state.updateDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const order = useOrdersStore((state) => state.activeOrder);
  const {
    isLoading,
    isOnline,
    mutate: addOrderDetailToOrder,
  } = useOrders().addOrderDetailToOrder;

  const goToMenu = () => {
    setActiveProduct(null);
    setActiveDetail(null);
    router.back();
  };

  if (!activeProduct) {
    return null;
  }

  const addProductToOrder = () => {
    if (activeProduct && order)
      addOrderDetailToOrder(
        {
          productId: activeProduct!.id,
          quantity: counter,
          price: activeProduct!.price,
          description: notes,
          orderId: order!.id,
        },
        {},
      );
  };

  const addProductToCart = () => {
    if (!activeOrderDetail) {
      addDetail({
        quantity: counter,
        product: activeProduct!,
        description: notes,
      });
    } else {
      updateDetail({
        quantity: counter,
        product: activeProduct!,
        description: notes,
      });
    }
  };

  const onAddProduct = () => {
    if (order) {
      addProductToOrder();
    } else {
      addProductToCart();
    }
    goToMenu();
  };

  if (!activeProduct) {
    return null;
  }

  return (
    <>
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between mb-4 items-center`}>
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h2">{activeProduct.name}</ThemedText>
            <ThemedText type="body1">
              {formatCurrency(activeProduct.price)}
            </ThemedText>
          </ThemedView>
          {/* <ThemedView style={tw`flex-row items-center gap-4`}> */}
          {/*   <IconButton */}
          {/*     icon="remove-outline" */}
          {/*     onPress={decrement} */}
          {/*     variant="outlined" */}
          {/*   /> */}
          {/*   <ThemedText>{counter}</ThemedText> */}
          {/*   <IconButton icon="add" onPress={increment} variant="outlined" /> */}
          {/* </ThemedView> */}
        </ThemedView>
        {activeProduct.description && (
          <ThemedText type="body2">{activeProduct.description}</ThemedText>
        )}
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
        <ThemedView style={tw`flex-1 `} />
      </ThemedView>
      <ThemedView style={tw`gap-4 p-4 rounded-xl shadow-xl `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h4">
            {formatCurrency(activeProduct.price * counter)}
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
          label={t("menu:product.addToOrderOrCart", {
            type: order ? t("menu:product.order") : t("menu:product.cart"),
          })}
          onPress={onAddProduct}
          leftIcon="cart-outline"
        />
      </ThemedView>
    </>
  );
}
