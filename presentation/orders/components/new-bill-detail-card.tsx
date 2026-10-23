import { useEffect } from "react";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { PressableProps } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { useCounter } from "@/presentation/shared/hooks/useCounter";
import { formatCurrency } from "@/core/i18n/utils";
import Checkbox from "@/presentation/theme/components/checkbox";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Card from "@/presentation/theme/components/card";

interface NewBillDetailCardProps extends PressableProps {
  detail: OrderDetail;
  quantity?: number;
  maxQuantity?: number;
  onChange?: (quantity: number) => void;
}

export default function NewBillDetailCard({
  onPress,
  onChange,
  quantity = 0,
  maxQuantity,
  detail,
}: NewBillDetailCardProps) {
  const { t } = useTranslation(["bills", "common"]);
  const availableQty = maxQuantity ?? detail.quantity - detail.qtyPaid;

  const { counter, increment, decrement, setCounter } = useCounter(
    quantity,
    1,
    availableQty,
    0,
    (value) => {
      onChange && onChange(value);
    },
  );

  useEffect(() => {
    setCounter(quantity);
  }, [quantity, setCounter]);
  const isSelected = counter > 0;

  const handleQuantityChange = (value: number) => {
    setCounter(value);
    onChange && onChange(value);
  };

  // Tapping the card is the fast path: all of it, or none of it.
  const toggleAll = () => handleQuantityChange(isSelected ? 0 : availableQty);

  const showProductOptionName =
    detail.product.options.length > 1 && detail.productOption;

  return (
    <Card
      style={({ pressed }) => [
        tw`p-6 gap-4`,
        isSelected && tw`bg-secondary`,
        pressed && tw`opacity-80`,
      ]}
      onPress={onPress ?? toggleAll}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      variant="outline"
    >
      {/* Product Info */}
      <ThemedView
        style={tw`flex-row justify-between items-center bg-transparent`}
      >
        <ThemedView style={tw`bg-transparent flex-1`}>
          <ThemedText type="body1" style={tw`font-semibold mb-1`}>
            {detail.product.name}
            {showProductOptionName ? ` ${detail.productOption?.name}` : ""}
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {` ×${availableQty}`}
            </ThemedText>
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {formatCurrency(detail.price)}
          </ThemedText>
        </ThemedView>

        {/* Counter Controls */}
        <ThemedView style={tw`flex-row items-center gap-2 bg-transparent`}>
          {availableQty === 1 ? (
            <Checkbox
              value={isSelected}
              onValueChange={(checked) => handleQuantityChange(checked ? 1 : 0)}
              accessibilityLabel={detail.product.name}
            />
          ) : (
            <>
              <IconButton
                icon="minus"
                variant="outlined"
                onPress={decrement}
                disabled={counter === 0}
                accessibilityLabel={t("common:actions.decrease")}
              />
              <ThemedText
                type="h4"
                style={tw`min-w-8 text-center`}
                accessibilityLiveRegion="polite"
              >
                {counter}
              </ThemedText>
              <IconButton
                icon="plus"
                onPress={increment}
                variant="outlined"
                disabled={counter === availableQty}
                accessibilityLabel={t("common:actions.increase")}
              />
            </>
          )}
        </ThemedView>
      </ThemedView>
      {/* Subtotal - only show when selected */}
      {isSelected && (
        <ThemedView style={tw`bg-transparent `}>
          <ThemedView
            style={tw`flex-row justify-between items-center bg-transparent`}
          >
            <ThemedText type="small">{t("bills:newBill.subtotal")}</ThemedText>
            <ThemedText type="body1">
              {formatCurrency(detail.price * counter)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </Card>
  );
}
