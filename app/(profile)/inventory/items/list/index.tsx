import { router, useLocalSearchParams } from "expo-router";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import InventoryItemsView from "@/presentation/inventory/components/inventory-items-view";
import { useInventoryItemCategories } from "@/presentation/inventory/hooks/useInventoryItemCategories";
import { InventoryItemStockStatusFilter } from "@/presentation/inventory/interfaces/dto/find-all-inventory-items.dto";

/**
 * Items of one category (`categoryId`), of the uncategorized bucket
 * (`uncategorized=true`) or of the whole inventory (neither), optionally
 * opened already filtered by a stock `status`.
 */
export default function InventoryItemsListScreen() {
  const { t } = useTranslation("inventory");
  const { categoryId, uncategorized, status, name } = useLocalSearchParams<{
    categoryId?: string;
    uncategorized?: string;
    status?: string;
    name?: string;
  }>();
  const { categories } = useInventoryItemCategories();

  const isUncategorized = uncategorized === "true";
  const initialStatus = Object.values(InventoryItemStockStatusFilter).find(
    (value) => value === status,
  );

  // Prefer live data over the param so a rename shows up straight away
  const categoryName =
    categories.find((category) => category.id === categoryId)?.name ?? name;
  const title = isUncategorized
    ? t("categories.none")
    : categoryId
      ? (categoryName ?? t("categories.title"))
      : t("allItems");

  return (
    <ScreenLayout style={tw`flex-1`}>
      <InventoryItemsView
        categoryId={categoryId || null}
        uncategorized={isUncategorized}
        title={title}
        initialStatus={initialStatus ?? null}
        onBack={() => router.back()}
        onOpenItem={(item) =>
          router.push({
            pathname: "/(profile)/inventory/items/detail",
            params: { itemId: item.id },
          })
        }
      />
    </ScreenLayout>
  );
}
