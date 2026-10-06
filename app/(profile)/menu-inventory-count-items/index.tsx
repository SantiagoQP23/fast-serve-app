import { useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import TextInput from "@/presentation/theme/components/text-input";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import {
  useCreateInventoryCount,
  useInventoryCount,
} from "@/presentation/inventory/hooks/useInventoryCounts";

/**
 * Picks the items to count. Without `countId` it starts a new count; with
 * it, the picked items are added to that count in progress.
 */
export default function MenuInventoryCountItemsScreen() {
  const { t } = useTranslation("inventory");
  const { countId } = useLocalSearchParams<{ countId?: string }>();
  const isAdding = !!countId;
  const { items, itemsQuery } = useInventoryItems();
  const { categories } = useInventoryItemCategories();
  const { count, addItems } = useInventoryCount(countId);
  const createCount = useCreateInventoryCount();
  const idempotencyKey = useRef(generateIdempotencyKey()).current;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const alreadyInCount = useMemo(
    () => new Set(count?.items?.map((line) => line.inventoryItem.id) ?? []),
    [count],
  );

  // The whole catalog is already loaded (useInventoryItems), so search and
  // category filtering happen locally — no request per keystroke.
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.isActive &&
        (!categoryId || item.category?.id === categoryId) &&
        (!term || item.name.toLowerCase().includes(term)),
    );
  }, [items, search, categoryId]);

  const selectableIds = visibleItems
    .map((item) => item.id)
    .filter((id) => !alreadyInCount.has(id));
  const allVisibleSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggle = (itemId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((current) => {
      const next = new Set(current);
      for (const id of selectableIds) {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const handleSubmit = () => {
    const inventoryItemIds = [...selected];
    if (isAdding) {
      addItems.mutate(inventoryItemIds, { onSuccess: () => router.back() });
      return;
    }
    createCount.mutate(
      { inventoryItemIds, idempotencyKey },
      {
        onSuccess: (newCount) =>
          router.replace({
            pathname: "/(profile)/menu-inventory-count-run",
            params: { countId: newCount.id },
          }),
      },
    );
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-8 gap-4 bg-transparent`}>
        <InventoryScreenHeader
          title={isAdding ? t("counts.addProducts") : t("counts.new")}
        />

        <TextInput
          placeholder={t("searchPlaceholder")}
          icon="search-outline"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
          >
            <Chip
              label={t("categories.all")}
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() =>
                  setCategoryId((current) =>
                    current === category.id ? null : category.id,
                  )
                }
              />
            ))}
          </ScrollView>
        )}

        <ThemedView
          style={tw`flex-row items-center justify-between gap-2 bg-transparent`}
        >
          <ThemedText type="small" style={tw`text-gray-500 flex-1`}>
            {t("counts.selectItemsHint")}
          </ThemedText>
          {selectableIds.length > 0 && (
            <Button
              label={
                allVisibleSelected
                  ? t("counts.unselectAll")
                  : t("counts.selectAll")
              }
              variant="text"
              size="small"
              onPress={toggleAllVisible}
            />
          )}
        </ThemedView>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-3 pb-8 pt-4`}
      >
        {itemsQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {!itemsQuery.isLoading && visibleItems.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Ionicons name="cube-outline" size={40} color="#999" />
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {items.length === 0 ? t("counts.noItems") : t("noResults")}
            </ThemedText>
          </ThemedView>
        )}

        {visibleItems.map((item) => {
          const inCount = alreadyInCount.has(item.id);
          const isSelected = selected.has(item.id);
          return (
            <Card
              key={item.id}
              variant={isSelected ? "outline" : "default"}
              onPress={inCount ? undefined : () => toggle(item.id)}
              style={tw`p-4`}
            >
              <ThemedView
                style={tw`flex-row items-center justify-between gap-3 bg-transparent`}
              >
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText type="body1" numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t("currentStock")}:{" "}
                    {t("quantityWithUnit", {
                      quantity: item.quantity,
                      unit: t(`units.${item.unit}`),
                    })}
                  </ThemedText>
                </ThemedView>
                {inCount ? (
                  <Label text={t("counts.alreadyInCount")} size="small" />
                ) : (
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={tw.color(isSelected ? "light-primary" : "gray-400")}
                  />
                )}
              </ThemedView>
            </Card>
          );
        })}
      </ScrollView>

      {selected.size > 0 && (
        <ThemedView style={tw`px-4 pb-2 pt-2 bg-transparent`}>
          <Button
            leftIcon={isAdding ? "add-outline" : "play-outline"}
            label={
              isAdding
                ? t("counts.addSelected", { count: selected.size })
                : t("counts.start", { count: selected.size })
            }
            loading={createCount.isPending || addItems.isPending}
            onPress={handleSubmit}
          />
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
