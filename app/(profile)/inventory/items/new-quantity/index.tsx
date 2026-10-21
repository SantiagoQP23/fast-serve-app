import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Counter from "@/presentation/theme/components/counter";
import IconButton from "@/presentation/theme/components/icon-button";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemDetail } from "@/presentation/inventory/hooks/useInventoryItemDetail";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useRestaurantSettings } from "@/presentation/restaurant/hooks/useRestaurantSettings";
import { DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK } from "@/core/restaurant/models/restaurant-settings.model";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

interface QuantityRow {
  productOptionId: number;
  label: string;
  quantity: number;
}

export default function NewInventoryItemQuantityScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    optionIds: string;
    inventoryItemId: string;
    itemName?: string;
    unit: string;
  }>();

  const unit = (params.unit as InventoryUnit) || InventoryUnit.UNIT;
  const quantityStep = unit !== InventoryUnit.UNIT ? 0.1 : 1;
  // One unit per sale is the usual case for counted items; weights and
  // volumes have no sensible default, so they start empty.
  const initialQuantity = unit === InventoryUnit.UNIT ? 1 : 0;

  const { products } = useMenu();
  const { item } = useInventoryItemDetail(params.inventoryItemId);
  const { settings } = useRestaurantSettings();
  const { linkProductOptions } = useInventoryItems();

  const [rows, setRows] = useState<QuantityRow[]>(() => {
    const ids = (params.optionIds ?? "")
      .split(",")
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0);
    const labels = new Map<number, string>();
    for (const product of products) {
      for (const option of product.options) {
        labels.set(
          option.id,
          product.options.length > 1
            ? `${product.name} · ${option.name}`
            : product.name,
        );
      }
    }
    return ids
      .filter((id) => labels.has(id))
      .map((id) => ({
        productOptionId: id,
        label: labels.get(id) ?? "",
        quantity: initialQuantity,
      }));
  });
  const [sameQuantity, setSameQuantity] = useState(initialQuantity);

  // Removing the last row leaves nothing to save: back to the picker.
  useEffect(() => {
    if (rows.length === 0) router.back();
  }, [rows.length]);

  const isPending = linkProductOptions.isPending;
  const canSave =
    rows.length > 0 && rows.every((row) => row.quantity >= 0.001) && !isPending;

  const blocksWithoutStock =
    (settings?.ALLOW_ORDERS_WITHOUT_STOCK ??
      DEFAULT_ALLOW_ORDERS_WITHOUT_STOCK) === false;
  const showZeroStockHint =
    blocksWithoutStock && !!item && Number(item.quantity) <= 0;

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.label.localeCompare(b.label)),
    [rows],
  );

  const handleSameQuantity = (quantity: number) => {
    setSameQuantity(quantity);
    setRows((current) => current.map((row) => ({ ...row, quantity })));
  };

  const handleRowQuantity = (productOptionId: number, quantity: number) => {
    setRows((current) =>
      current.map((row) =>
        row.productOptionId === productOptionId ? { ...row, quantity } : row,
      ),
    );
  };

  const handleRemoveRow = (productOptionId: number) => {
    setRows((current) =>
      current.filter((row) => row.productOptionId !== productOptionId),
    );
  };

  const handleConfirm = async () => {
    if (!canSave) return;

    await linkProductOptions.mutateAsync({
      itemId: params.inventoryItemId,
      data: {
        lines: rows.map(({ productOptionId, quantity }) => ({
          productOptionId,
          quantity,
        })),
      },
    });
    router.dismissTo({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: params.inventoryItemId },
    });
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-8 flex-1`}>
        <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
          <ThemedView style={tw`items-center gap-4 flex-row flex-1`}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.goBack")}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Icon
                name="arrow-left"
                color={tw.color("on-surface")}
                size={24}
              />
            </Pressable>
            <ThemedView style={tw`flex-1`}>
              <ThemedText
                type="h3"
                style={{ fontFamily: typography.regular }}
                numberOfLines={1}
              >
                {t("linkedItem.quantityTitle")}
              </ThemedText>
              {!!params.itemName && (
                <ThemedText
                  type="small"
                  style={tw`text-gray-500`}
                  numberOfLines={1}
                >
                  {params.itemName}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
          <Button
            label={t("linkedItem.save")}
            size="small"
            onPress={handleConfirm}
            loading={isPending}
            disabled={!canSave}
          />
        </ThemedView>

        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={tw`gap-6 pt-8 pb-10`}
        >
          <ThemedText type="body1" style={tw`text-gray-600`}>
            {t("linkedItem.quantityDescription", { item: params.itemName })}
          </ThemedText>

          {showZeroStockHint && (
            <ThemedView
              style={tw`flex-row items-start gap-2 rounded-md bg-orange-100 p-3`}
            >
              <Icon
                name="triangle-alert"
                size={18}
                color={tw.color("orange-700")}
              />
              <ThemedText type="small" style={tw`flex-1 text-orange-700`}>
                {t("linkedItem.zeroStockHint")}
              </ThemedText>
            </ThemedView>
          )}

          {rows.length > 1 && (
            <View style={tw`gap-2`}>
              <ThemedText style={tw`text-gray-500`}>
                {t("linkedItem.sameQuantityForAll")}
              </ThemedText>
              <Counter
                value={sameQuantity}
                onChangeValue={handleSameQuantity}
                step={quantityStep}
                min={0}
                unit={t(`units.${unit}`, { count: sameQuantity })}
              />
            </View>
          )}

          <ThemedView style={tw`gap-3 bg-transparent`}>
            {sortedRows.map((row) => (
              <ThemedView
                key={row.productOptionId}
                style={tw`rounded-md bg-surface-container-low p-4 gap-3`}
              >
                <ThemedView
                  style={tw`flex-row items-center justify-between gap-2 bg-transparent`}
                >
                  <ThemedText type="body1" style={tw`flex-1`} numberOfLines={2}>
                    {row.label}
                  </ThemedText>
                  <IconButton
                    icon="x"
                    size={18}
                    onPress={() => handleRemoveRow(row.productOptionId)}
                    style={tw`-mr-2 p-2`}
                    accessibilityLabel={t("linkedItem.removeProduct")}
                  />
                </ThemedView>
                <Counter
                  value={row.quantity}
                  onChangeValue={(quantity) =>
                    handleRowQuantity(row.productOptionId, quantity)
                  }
                  step={quantityStep}
                  min={0}
                  unit={t(`units.${unit}`, { count: row.quantity })}
                  size="small"
                />
              </ThemedView>
            ))}
          </ThemedView>
        </ScrollView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
