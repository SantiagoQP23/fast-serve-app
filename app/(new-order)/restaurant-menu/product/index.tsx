import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { router, useRouter } from "expo-router";
import Switch from "@/presentation/theme/components/switch";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ProductStatus } from "@/core/menu/models/product.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";

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
  const [withCustomPrice, setWithCustomPrice] = useState(
    !!activeOrderDetail?.price,
  );
  const [customPrice, setCustomPrice] = useState(
    String(activeOrderDetail?.price ?? activeProduct?.price ?? ""),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    activeOrderDetail?.tagIds ?? [],
  );

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

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

  const isUnavailable = activeProduct.status !== ProductStatus.AVAILABLE;

  const statusLabelColor =
    activeProduct.status === ProductStatus.OUT_OF_STOCK ? "error" : "warning";

  const effectivePrice = withCustomPrice
    ? parseFloat(customPrice) || activeProduct!.price
    : undefined;

  const addProductToOrder = () => {
    if (activeProduct && order)
      addOrderDetailToOrder(
        {
          productId: activeProduct!.id,
          quantity: counter,
          price: effectivePrice ?? activeProduct!.price,
          description: notes,
          orderId: order!.id,
          tagIds: selectedTagIds,
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
        price: effectivePrice,
        tagIds: selectedTagIds,
      });
    } else {
      updateDetail({
        quantity: counter,
        product: activeProduct!,
        description: notes,
        price: effectivePrice,
        tagIds: selectedTagIds,
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
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw` text-center mb-4 gap-2`}>
          <ThemedText type="h2">{activeProduct.name}</ThemedText>
          <ThemedText type="body1">
            {formatCurrency(activeProduct.price)}
          </ThemedText>
          {isUnavailable && (
            <Label
              text={t(`menu:product.status.${activeProduct.status}`)}
              color={statusLabelColor}
            />
          )}
          {activeProduct.tags?.filter((tag) => tag.isActive && !tag.isArchived)
            .length > 0 && (
            <ThemedView style={tw`flex-row flex-wrap gap-2 justify-center`}>
              {activeProduct.tags
                .filter((tag) => tag.isActive && !tag.isArchived)
                .map((tag) => (
                  <Label
                    key={tag.id}
                    text={tag.name}
                    color={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    onPress={() => toggleTag(tag.id)}
                  />
                ))}
            </ThemedView>
          )}
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
          <TextInput
            numberOfLines={5}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder={t("orders:newOrder.addNote")}
            containerStyle={tw`border-0 p-0`}
            autoFocus={false}
          />
        </ThemedView>
        <ThemedView>
          <Switch
            label={t("orders:newOrder.customPrice")}
            value={withCustomPrice}
            onValueChange={(val) => {
              setWithCustomPrice(val);
              if (val && !customPrice) {
                setCustomPrice(String(activeProduct!.price));
              }
            }}
          />
          {withCustomPrice && (
            <TextInput
              value={customPrice}
              onChangeText={setCustomPrice}
              keyboardType="decimal-pad"
            />
          )}
        </ThemedView>
        <ThemedView style={tw`flex-1 `} />
        <ThemedView style={tw`gap-4`}>
          <ThemedView style={tw`flex-row justify-between items-center`}>
            <ThemedText type="h4">
              {formatCurrency(
                (effectivePrice ?? activeProduct.price) * counter,
              )}
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
            disabled={isUnavailable}
          />
        </ThemedView>
      </ScreenLayout>
    </>
  );
}
