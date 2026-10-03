import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Counter from "@/presentation/theme/components/counter";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { InventoryUnit } from "@/core/inventory/models/inventory-item.model";

export default function NewInventoryItemQuantityScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productOptionId: string;
    productOptionName?: string;
    productName?: string;
    inventoryItemId: string;
    itemName?: string;
    unit: string;
  }>();

  const itemName = params.itemName;

  const productOptionId = Number(params.productOptionId);
  const unit = (params.unit as InventoryUnit) || InventoryUnit.UNIT;
  const quantityStep = unit !== InventoryUnit.UNIT ? 0.1 : 1;

  const { linkProductOption } = useInventoryItems();
  const [quantityUsed, setQuantityUsed] = useState(0);

  const isPending = linkProductOption.isPending;

  const productLabel = [params.productName, params.productOptionName]
    .filter(Boolean)
    .join(" - ");

  const handleConfirm = async () => {
    if (quantityUsed < 0.001) return;

    await linkProductOption.mutateAsync({
      itemId: params.inventoryItemId,
      data: { productOptionId, quantity: quantityUsed },
    });
    router.dismissTo({
      pathname: "/(profile)/menu-inventory-item-detail",
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
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedView style={tw`flex-1`}>
              <ThemedText
                type="h3"
                style={{ fontFamily: typography.regular }}
                numberOfLines={1}
              >
                {t("linkedItem.quantityTitle")}
              </ThemedText>
              {!!productLabel && (
                <ThemedText
                  type="small"
                  style={tw`text-gray-500`}
                  numberOfLines={1}
                >
                  {productLabel}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
          <Button
            label={t("linkedItem.finish")}
            size="small"
            onPress={handleConfirm}
            loading={isPending}
            disabled={quantityUsed < 0.001 || isPending}
          />
        </ThemedView>

        <ThemedView style={tw`mt-10 gap-8`}>
          <ThemedText type="body1" style={tw`text-gray-600`}>
            {t("linkedItem.quantityDescription", { item: itemName })}
          </ThemedText>

          <View style={tw`gap-2`}>
            <ThemedText style={tw`dark:text-gray-300 text-gray-500`}>
              {t("recipe.fields.quantity")}
            </ThemedText>
            <Counter
              value={quantityUsed}
              onChangeValue={setQuantityUsed}
              step={quantityStep}
              min={0}
              unit={t(`units.${unit}`)}
              size="large"
            />
          </View>
        </ThemedView>
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
