import { useMemo } from "react";
import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import { formatCurrency } from "@/core/i18n/utils";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";

export default function NewInventoryItemSelectOptionScreen() {
  const { t } = useTranslation("inventory");
  const params = useLocalSearchParams<{
    productId: string;
    productName?: string;
  }>();
  const { products } = useMenu();

  const product = products.find((p) => p.id === params.productId);

  const activeOptions = useMemo(
    () => product?.options.filter((option) => option.isActive) ?? [],
    [product],
  );

  const handleSelectOption = (option: ProductOption) => {
    router.push({
      pathname: "/(profile)/menu-inventory-item-form",
      params: {
        productOptionId: String(option.id),
        productOptionName: option.name,
        productName: params.productName ?? product?.name ?? "",
      },
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-4 flex-row mb-6`}>
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
            {t("linkedItem.selectOptionTitle")}
          </ThemedText>
          {!!(params.productName ?? product?.name) && (
            <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
              {params.productName ?? product?.name}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      {!product ? (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText type="body1" style={tw`text-red-500`}>
            {t("loadError")}
          </ThemedText>
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-back-outline"
            onPress={() => router.back()}
            variant="outline"
          />
        </ThemedView>
      ) : activeOptions.length === 0 ? (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="options-outline" size={48} color="#999" />
          <ThemedText type="body1" style={tw`font-semibold text-center`}>
            {t("linkedItem.noOptions")}
          </ThemedText>
        </ThemedView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-8`}
        >
          {activeOptions.map((option) => (
            <Card
              key={option.id}
              onPress={() => handleSelectOption(option)}
              style={[tw`p-4`, option.isDefault && tw`bg-light-secondary`]}
            >
              <ThemedView style={tw`flex-row items-center justify-between`}>
                <ThemedText
                  type="body1"
                  style={option.isDefault && tw`text-light-on-secondary`}
                >
                  {option.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2`}>
                  <ThemedText
                    type="body2"
                    style={option.isDefault && tw`text-light-on-secondary`}
                  >
                    {formatCurrency(option.price)}
                  </ThemedText>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={
                      option.isDefault
                        ? tw.color("light-on-secondary")
                        : tw.color("gray-400")
                    }
                  />
                </ThemedView>
              </ThemedView>
            </Card>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}
