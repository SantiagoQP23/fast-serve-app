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
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useProductSearch } from "@/presentation/restaurant-menu/hooks/useProductSearch";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";

/**
 * Checkbox list of the menu products that are not in this production area
 * yet, to bring several of them in at once. A product belongs to a single
 * area, so adding it here takes it out of its current one.
 */
export default function ProductionAreaAddProductsScreen() {
  const { t } = useTranslation("productionAreas");
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { productionAreas, getAllQuery } = useProductionAreas();
  const { categories: allCategories, products } = useMenu();
  const { moveProductsToArea } = useMenuManagement();
  const area = productionAreas.find((current) => String(current.id) === areaId);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Products already in the area are not offered again.
  const candidates = useMemo(
    () =>
      products.filter(
        (product) => String(product.productionArea?.id) !== areaId,
      ),
    [products, areaId],
  );
  const categories = useMemo(
    () => allCategories.filter((category) => category.isActive),
    [allCategories],
  );
  const categoryProducts = useMemo(
    () =>
      categoryId
        ? candidates.filter((product) => product.category?.id === categoryId)
        : candidates,
    [candidates, categoryId],
  );
  const filteredProducts = useProductSearch(categoryProducts, search);

  // Ids that left the list (added from another phone) drop out of the
  // selection on their own.
  const selected = useMemo(
    () => candidates.filter((p) => selectedIds.has(p.id)).map((p) => p.id),
    [candidates, selectedIds],
  );

  const toggle = (productId: string, value: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (value) next.add(productId);
      else next.delete(productId);
      return next;
    });

  const handleAdd = async () => {
    if (!area) return;
    const { failed } = await moveProductsToArea.mutateAsync({
      productIds: selected,
      productionAreaId: area.id,
    });
    // Added products leave this list on their own, so failed ones stay
    // selected for a retry.
    if (failed === 0) router.back();
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
            {t("products.addTitle")}
          </ThemedText>
          {area && (
            <ThemedText
              type="body2"
              style={tw`text-gray-500`}
              numberOfLines={1}
            >
              {area.name}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      {!area ? (
        <ThemedView style={tw`items-center py-8 gap-3`}>
          {getAllQuery.isLoading ? (
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {t("loading")}
            </ThemedText>
          ) : (
            <>
              <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {t("products.notFound")}
              </ThemedText>
            </>
          )}
        </ThemedView>
      ) : (
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
                label={t("products.allCategories")}
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
            {candidates.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Icon name="hamburger" size={40} color={tw.color("gray-400")} />
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("products.nothingToAdd")}
                </ThemedText>
              </ThemedView>
            )}

            {candidates.length > 0 && filteredProducts.length === 0 && (
              <ThemedView style={tw`items-center py-8 gap-3`}>
                <Icon name="search" size={40} color={tw.color("gray-400")} />
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("products.noResults")}
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
                      {[
                        product.category?.name,
                        product.productionArea?.name ?? t("products.noArea"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
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

          {selected.length > 0 && (
            <ThemedView style={tw`pt-2 pb-6`}>
              <Button
                label={t("products.addCount", { count: selected.length })}
                onPress={() => void handleAdd().catch(() => {})}
                loading={moveProductsToArea.isPending}
                disabled={moveProductsToArea.isPending}
              />
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
