import { router } from "expo-router";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useShoppingList } from "@/presentation/inventory/hooks/useShoppingList";
import ShoppingListRow from "@/presentation/inventory/components/shopping-list-row";
import {
  getSuggestedPurchaseQuantity,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

/** How many items it lists before "See full list". */
const PREVIEW_LIMIT = 5;

interface ShoppingListPreviewProps {
  /** Overrides navigating to the item screen, e.g. to open a side pane. */
  onOpenItem?: (item: InventoryItem) => void;
  /** Item currently shown in the side pane. */
  activeId?: string;
}

/**
 * The Productos hub's glance at the shopping list: how much to buy of the
 * most urgent items, and the way to the full list.
 */
export default function ShoppingListPreview({
  onOpenItem,
  activeId,
}: ShoppingListPreviewProps) {
  const { t } = useTranslation("inventory");
  const { lowItems, outWithoutMinimum, itemsQuery } = useShoppingList();
  const shown = lowItems.slice(0, PREVIEW_LIMIT);
  const hidden = lowItems.length - shown.length;
  const isEmpty = lowItems.length === 0 && outWithoutMinimum.length === 0;

  const openItem = (item: InventoryItem) =>
    onOpenItem
      ? onOpenItem(item)
      : router.push({
          pathname: "/(profile)/inventory/items/detail",
          params: { itemId: item.id },
        });

  return (
    <ThemedView style={tw`gap-3 bg-transparent`}>
      <DetailSectionTitle
        title={t("shoppingList.title")}
        action={
          !isEmpty && (
            <Button
              label={t("shoppingList.seeFull")}
              variant="text"
              size="extra-small"
              style={tw`-mr-3`}
              onPress={() =>
                router.push({
                  pathname: "/(profile)/inventory/purchases/shopping-list",
                })
              }
            />
          )
        }
      />
      <DetailCard style={tw`py-2`}>
        {itemsQuery.isLoading ? (
          <ThemedText type="body2" style={tw`text-gray-500 py-3`}>
            {t("loading")}
          </ThemedText>
        ) : isEmpty ? (
          <ThemedText type="body2" style={tw`text-gray-500 py-3`}>
            {t("shoppingList.allGood")}
          </ThemedText>
        ) : (
          <ThemedView style={tw`bg-transparent`}>
            {shown.map((item, index) => (
              <ShoppingListRow
                key={item.id}
                item={item}
                quantity={getSuggestedPurchaseQuantity(item)}
                divider={index < shown.length - 1}
                active={activeId === item.id}
                onPress={() => openItem(item)}
              />
            ))}
            {/* What the preview leaves out, so nothing goes unnoticed */}
            {(hidden > 0 || outWithoutMinimum.length > 0) && (
              <ThemedText
                type="small"
                style={tw.style(
                  "text-gray-500 pb-2",
                  shown.length > 0 && "pt-1",
                )}
              >
                {[
                  hidden > 0 && t("shoppingList.moreCount", { count: hidden }),
                  outWithoutMinimum.length > 0 &&
                    t("shoppingList.outWithoutMinimumCount", {
                      count: outWithoutMinimum.length,
                    }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </ThemedText>
            )}
          </ThemedView>
        )}
      </DetailCard>
    </ThemedView>
  );
}
