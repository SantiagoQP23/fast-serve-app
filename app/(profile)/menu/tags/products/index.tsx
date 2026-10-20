import { useMemo, useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import TextInput from "@/presentation/theme/components/text-input";
import Chip from "@/presentation/theme/components/chip";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import { useTags } from "@/presentation/menu-management/hooks/useTags";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";

/** Checkbox list of menu products to put one tag on, saved all at once. */
export default function MenuTagProductsScreen() {
  const { t } = useTranslation("menuManagement");
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const { tags, setTagProducts } = useTags();
  const { categories: allCategories, products } = useMenu();
  const tag = tags.find((current) => current.id === tagId);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  // null until the first change: follows the tag's products, which may
  // still be loading when the screen opens.
  const [changedIds, setChangedIds] = useState<Set<string> | null>(null);
  const selectedIds = useMemo(
    () => changedIds ?? new Set(tag?.productIds ?? []),
    [changedIds, tag],
  );

  const categories = useMemo(
    () => allCategories.filter((category) => category.isActive),
    [allCategories],
  );
  const categoryProducts = useMemo(
    () =>
      categoryId
        ? products.filter((product) => product.category?.id === categoryId)
        : products,
    [products, categoryId],
  );
  const filteredProducts = useProductSearch(categoryProducts, search);

  const hasChanges = useMemo(() => {
    const initial = new Set(tag?.productIds ?? []);
    if (initial.size !== selectedIds.size) return true;
    return [...selectedIds].some((id) => !initial.has(id));
  }, [tag, selectedIds]);

  const toggle = (productId: string, value: boolean) =>
    setChangedIds(() => {
      const next = new Set(selectedIds);
      if (value) next.add(productId);
      else next.delete(productId);
      return next;
    });

  const handleSave = async () => {
    if (!tag) return;
    await setTagProducts.mutateAsync({
      id: tag.id,
      productIds: [...selectedIds],
    });
    router.back();
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
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
        <ThemedView style={tw`flex-1 bg-transparent`}>
          <ThemedText
            type="h3"
            style={{ fontFamily: typography.regular }}
            numberOfLines={1}
          >
            {t("tags.linkProducts")}
          </ThemedText>
          {tag && (
            <ThemedText
              type="body2"
              style={tw`text-gray-500`}
              numberOfLines={1}
            >
              {tag.name}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={tw`gap-4 flex-1`}>
        <TextInput
          placeholder={t("products.searchPlaceholder")}
          icon="search"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 items-center`}
            style={tw`flex-none`}
          >
            <Chip
              label={t("tags.allCategories")}
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

        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-3 pb-8`}
        >
          {products.length > 0 && filteredProducts.length === 0 && (
            <ThemedView style={tw`items-center py-8 gap-3`}>
              <Icon name="search" size={40} color={tw.color("gray-400")} />
              <ThemedText type="body1" style={tw`font-semibold`}>
                {t("tags.noResults")}
              </ThemedText>
            </ThemedView>
          )}

          {filteredProducts.map((product) => {
            const checked = selectedIds.has(product.id);
            return (
              <Pressable
                key={product.id}
                onPress={() => toggle(product.id, !checked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={({ pressed }) => [
                  tw`p-4 rounded-2xl bg-surface-container-low flex-row items-center gap-3`,
                  !product.isActive && tw`opacity-50`,
                  pressed && tw`opacity-80`,
                ]}
              >
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText type="body1" numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={tw`text-gray-600`}
                    numberOfLines={1}
                  >
                    {product.category?.name}
                  </ThemedText>
                </ThemedView>
                <Checkbox
                  value={checked}
                  onValueChange={(value) => toggle(product.id, value)}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {hasChanges && (
          <ThemedView style={tw`pt-2 pb-6`}>
            <Button
              label={t("tags.saveProductsCount", { count: selectedIds.size })}
              onPress={handleSave}
              loading={setTagProducts.isPending}
              disabled={!tag || setTagProducts.isPending}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
