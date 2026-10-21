import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";
import { useProductionAreas } from "@/presentation/production-areas/hooks/useProductionAreas";
import { useMenu } from "@/presentation/restaurant-menu/hooks/useMenu";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import type { Product } from "@/core/menu/models/product.model";

interface CategoryGroup {
  key: string;
  name: string;
  products: Product[];
}

export default function ProductionAreaDetailScreen() {
  const { t } = useTranslation("productionAreas");
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);
  const { productionAreas, getAllQuery } = useProductionAreas();
  const { products: menuProducts } = useMenu();
  const { moveProductsToArea } = useMenuManagement();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const areaPickerRef = useRef<BottomSheetPickerRef>(null);

  const area = productionAreas.find((current) => String(current.id) === areaId);

  const products = useMemo(
    () =>
      menuProducts.filter(
        (product) => String(product.productionArea?.id) === areaId,
      ),
    [menuProducts, areaId],
  );

  const groups = useMemo<CategoryGroup[]>(() => {
    const byCategory = new Map<string, CategoryGroup>();
    for (const product of products) {
      const key = product.category?.id ?? "";
      const group = byCategory.get(key) ?? {
        key,
        name: product.category?.name ?? t("products.noCategory"),
        products: [],
      };
      group.products.push(product);
      byCategory.set(key, group);
    }
    const sorted = [...byCategory.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const group of sorted) {
      group.products.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [products, t]);

  const targetOptions = productionAreas
    .filter((current) => String(current.id) !== areaId)
    .map((current) => ({ label: current.name, value: current.id }));

  // Ids that are no longer in this area (moved by this screen or from another
  // phone) drop out of the selection on their own.
  const selected = useMemo(
    () => products.filter((p) => selectedIds.has(p.id)).map((p) => p.id),
    [products, selectedIds],
  );
  const isSelecting = selected.length > 0;
  const allSelected =
    products.length > 0 && selected.length === products.length;

  const toggleProduct = (id: string, value: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleGroup = (group: CategoryGroup) => {
    const groupSelected = group.products.every((p) => selectedIds.has(p.id));
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const product of group.products) {
        if (groupSelected) next.delete(product.id);
        else next.add(product.id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(products.map((p) => p.id)),
    );
  };

  const handleMove = async (value: string | number) => {
    const { failed } = await moveProductsToArea.mutateAsync({
      productIds: selected,
      productionAreaId: Number(value),
    });
    // Moved products leave this list on their own, so failed ones stay
    // selected for a retry.
    if (failed === 0) setSelectedIds(new Set());
  };

  const header = (
    <ThemedView style={tw`items-center gap-3 flex-row mb-6 bg-transparent`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common:actions.goBack")}
        style={({ pressed }) => tw.style(pressed && "opacity-70")}
      >
        <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
      </Pressable>
      {isSelecting && (
        <ThemedView
          style={tw`flex-row items-center gap-2 ml-auto bg-transparent`}
        >
          {!allSelected && (
            <Button
              label={t("products.selectAll")}
              variant="text"
              size="extra-small"
              onPress={toggleAll}
            />
          )}
          <Button
            label={t("products.cancelSelection")}
            variant="surface"
            size="extra-small"
            onPress={() => setSelectedIds(new Set())}
          />
        </ThemedView>
      )}
    </ThemedView>
  );

  if (!area) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        {header}
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
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw.style(
          "gap-8",
          isSelecting ? "pb-32" : "pb-8",
        )}
      >
        <ThemedView style={tw`gap-1`}>
          <ThemedText type="h1">{area.name}</ThemedText>
        </ThemedView>
        <ThemedText type="h4" style={tw`text-primary`}>
          {t("productCount", { count: products.length })}
        </ThemedText>

        {/* {!!area.printers?.length && ( */}
        {/*   <ThemedView style={tw`flex-row flex-wrap gap-2`}> */}
        {/*     {area.printers.map((printer) => ( */}
        {/*       <Chip */}
        {/*         key={printer.id} */}
        {/*         variant="assist" */}
        {/*         icon="printer" */}
        {/*         label={printer.name} */}
        {/*       /> */}
        {/*     ))} */}
        {/*   </ThemedView> */}
        {/* )} */}

        {products.length === 0 ? (
          <ThemedView
            style={tw`items-center py-6 gap-2 bg-gray-50 rounded-3xl px-4 mt-2`}
          >
            <Icon name="hamburger" size={28} color={tw.color("gray-400")} />
            <ThemedText type="body2" style={tw`font-semibold`}>
              {t("products.empty")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-center text-gray-500`}>
              {t("products.emptyDescription")}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {groups.map((group) => {
              const groupSelected = group.products.every((p) =>
                selectedIds.has(p.id),
              );
              return (
                <ThemedView key={group.key} style={tw`gap-1`}>
                  <ThemedView
                    style={tw`flex-row items-center justify-between gap-3`}
                  >
                    <ThemedText type="caption" style={tw`flex-1`}>
                      {group.name}
                    </ThemedText>
                    {isSelecting && (
                      <Checkbox
                        size="small"
                        value={groupSelected}
                        onValueChange={() => toggleGroup(group)}
                      />
                    )}
                  </ThemedView>

                  {group.products.map((product) => {
                    const checked = selectedIds.has(product.id);
                    return (
                      <Pressable
                        key={product.id}
                        disabled={!canManage}
                        onPress={
                          isSelecting
                            ? () => toggleProduct(product.id, !checked)
                            : undefined
                        }
                        onLongPress={() => toggleProduct(product.id, !checked)}
                        style={({ pressed }) =>
                          tw.style(
                            "flex-row items-center gap-3 py-3",
                            !product.isActive && "opacity-50",
                            pressed && "opacity-80",
                          )
                        }
                      >
                        <ThemedText
                          type="body1"
                          style={[
                            tw`flex-1`,
                            { fontFamily: typography.medium },
                          ]}
                          numberOfLines={1}
                        >
                          {product.name}
                        </ThemedText>
                        {isSelecting && (
                          <Checkbox
                            value={checked}
                            onValueChange={(value) =>
                              toggleProduct(product.id, value)
                            }
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ThemedView>
              );
            })}
          </>
        )}

        {canManage && !isSelecting && (
          <Button
            label={t("products.addProducts")}
            leftIcon="plus"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: "/(profile)/production/areas/products",
                params: { areaId },
              })
            }
          />
        )}
      </ScrollView>

      {isSelecting && (
        <ThemedView
          style={tw`absolute bottom-6 left-4 right-4 flex-row items-center gap-4 p-4 rounded-3xl bg-surface-high`}
        >
          <ThemedText type="body1" style={tw`flex-1`}>
            {t("products.selectedCount", { count: selected.length })}
          </ThemedText>
          <Button
            label={t("products.moveToArea")}
            leftIcon="arrow-right-left"
            size="small"
            loading={moveProductsToArea.isPending}
            disabled={
              moveProductsToArea.isPending || targetOptions.length === 0
            }
            onPress={() => areaPickerRef.current?.present()}
          />
        </ThemedView>
      )}

      <BottomSheetPicker
        ref={areaPickerRef}
        title={t("products.moveSheetTitle")}
        options={targetOptions}
        onChange={(value) => void handleMove(value).catch(() => {})}
      />
    </ScreenLayout>
  );
}
