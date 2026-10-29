import { ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import TextInput from "@/presentation/theme/components/text-input";
import Button from "@/presentation/theme/components/button";
import { useInventoryItemsSearch } from "@/presentation/inventory/hooks/useInventoryItemsSearch";
import InventoryItemCard from "@/presentation/inventory/components/inventory-item-card";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";

export default function MenuInventorySearchScreen() {
  const { t } = useTranslation("inventory");
  const { search, handleChangeSearch, hasSearchTerm, items, itemsQuery } =
    useInventoryItemsSearch();

  const handleSelectItem = (item: InventoryItem) => {
    router.push({
      pathname: "/(profile)/inventory/items/detail",
      params: { itemId: item.id },
    });
  };

  // From a search with no match, the form starts with what was typed
  const handleCreateItem = () => {
    router.push({
      pathname: "/(profile)/inventory/items/form",
      params: search.trim() ? { name: search.trim() } : {},
    });
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      <ThemedView style={tw`items-center gap-3 flex-row mb-6`}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
        <ThemedText
          type="h3"
          style={{ fontFamily: typography.medium, flex: 1 }}
          numberOfLines={1}
        >
          {t("searchTitle")}
        </ThemedText>
      </ThemedView>

      <TextInput
        placeholder={t("searchPlaceholder")}
        icon="search"
        value={search}
        onChangeText={handleChangeSearch}
        returnKeyType="search"
        autoFocus
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-3.5 pb-8 pt-6`}
      >
        {!hasSearchTerm && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="search" size={40} color={tw.color("gray-400")} />
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("searchHint")}
            </ThemedText>
          </ThemedView>
        )}

        {hasSearchTerm && itemsQuery.isLoading && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          </ThemedView>
        )}

        {hasSearchTerm && itemsQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
          </ThemedView>
        )}

        {hasSearchTerm &&
          !itemsQuery.isLoading &&
          !itemsQuery.isError &&
          items.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="search" size={40} color={tw.color("gray-400")} />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("noResults")}
              </ThemedText>
              <ThemedText
                type="body2"
                style={tw`text-center text-gray-500 px-4`}
              >
                {t("noResultsDescription")}
              </ThemedText>
              <Button
                label={t("createItem")}
                leftIcon="plus"
                size="small"
                onPress={handleCreateItem}
                style={tw`mt-2`}
              />
            </ThemedView>
          )}

        {items.map((item) => (
          <InventoryItemCard
            key={item.id}
            item={item}
            onPress={handleSelectItem}
            showCategory
          />
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}
