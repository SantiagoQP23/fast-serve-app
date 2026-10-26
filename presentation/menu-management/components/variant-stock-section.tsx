import { useRef, useState, type ReactNode } from "react";
import { router } from "expo-router";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Icon from "@/presentation/theme/components/icon";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import TextInput from "@/presentation/theme/components/text-input";
import { GroupedList } from "@/presentation/theme/components/grouped-list";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { canManageInventory } from "@/core/auth/models/user.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { useInventoryItemDetail } from "@/presentation/inventory/hooks/useInventoryItemDetail";
import { useVariantStock } from "@/presentation/inventory/hooks/useVariantStock";
import AdjustStockModal from "@/presentation/inventory/components/adjust-stock-modal";
import InventoryDetailSummaryCard from "@/presentation/inventory/components/inventory-detail-summary-card";
import InventoryMovementHistory from "@/presentation/inventory/components/inventory-movement-history";
import InventorySectionHeader from "@/presentation/inventory/components/inventory-section-header";
import StockModeSheet, {
  type OwnStockInput,
} from "@/presentation/menu-management/components/stock-mode-sheet";
import {
  getLineItemId,
  getOwnStockLine,
  type ProductOptionInventoryItem,
} from "@/core/inventory/models/inventory-recipe.model";
import {
  getInventoryStockStatus,
  isProductStockItem,
  type InventoryItem,
  type InventoryStockStatus,
} from "@/core/inventory/models/inventory-item.model";
import {
  getLimitingRecipeLine,
  getProductOptionAvailableQuantity,
  getProductOptionStockLevel,
  getVariantStockMode,
  type ProductOption,
  type VariantStockMode,
} from "@/core/menu/models/product-optionl.model";
import type { Product } from "@/core/menu/models/product.model";

/** Another variant that uses the same item, as "Producto · Variante". */
interface RelatedVariant {
  option: ProductOption;
  product: Product;
  line: ProductOptionInventoryItem;
}

export const variantName = (product: Product, option: ProductOption) =>
  product.hasVariants === false ||
  product.options.filter((o) => o.isActive).length <= 1
    ? product.name
    : `${product.name} · ${option.name}`;

/**
 * Opens a variant. A product with a single active variant shows that
 * variant on its own screen, so it opens the product instead.
 */
export const openVariant = (
  productOptionId: number,
  { openStockMode = false }: { openStockMode?: boolean } = {},
) => {
  const product = useMenuStore
    .getState()
    .products.find((p) => p.options?.some((o) => o.id === productOptionId));
  const activeCount = product?.options.filter((o) => o.isActive).length ?? 0;
  if (product && activeCount === 1) {
    router.push({
      pathname: "/(profile)/menu/products/detail",
      params: { productId: product.id },
    });
    return;
  }
  router.push({
    pathname: "/(profile)/menu/products/variant",
    params: {
      productOptionId: String(productOptionId),
      ...(openStockMode ? { openStockMode: "true" } : {}),
    },
  });
};

/**
 * Everything the variant stock section needs: the variant's stock mode,
 * its own stock (fresh from the server when online), the variants it
 * shares or feeds, and the sheets and modals that change them. Used by
 * the variant screen and by the product screen when it has one variant.
 */
export function useVariantStockSection(
  product: Product | undefined,
  option: ProductOption | undefined,
) {
  const { t } = useTranslation("inventory");
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  const products = useMenuStore((state) => state.products);
  const { enable, disable, separate, convertToIngredient } = useVariantStock();

  const mode: VariantStockMode = option ? getVariantStockMode(option) : "none";
  const ownLine = option ? getOwnStockLine(option.inventoryItems) : null;
  const ownItemId = ownLine ? (getLineItemId(ownLine) ?? "") : "";
  const { item, itemQuery, movements, movementsQuery } =
    useInventoryItemDetail(ownItemId);
  // Fresh from the server when online, else what the phone has.
  const ownItem: InventoryItem | undefined = item ?? ownLine?.inventoryItem;

  const modeSheetRef = useRef<BottomSheetMethods>(null);
  const optionsSheetRef = useRef<BottomSheetMethods>(null);
  const minimumSheetRef = useRef<BottomSheetMethods>(null);
  const [minimum, setMinimum] = useState("");
  const [adjustMode, setAdjustMode] = useState<"restock" | "decrease" | null>(
    null,
  );
  const [confirmToIngredient, setConfirmToIngredient] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Other variants using this variant's own stock: sharing it as their own
  // stock, or using it in a recipe (a combo).
  const sharedWith: RelatedVariant[] = [];
  const usedIn: RelatedVariant[] = [];
  if (ownItemId && option) {
    for (const p of products) {
      for (const o of p.options ?? []) {
        if (o.id === option.id || !o.isActive) continue;
        const line = (o.inventoryItems ?? []).find(
          (l) => getLineItemId(l) === ownItemId,
        );
        if (!line) continue;
        const related = { option: o, product: p, line };
        if (getOwnStockLine(o.inventoryItems)) sharedWith.push(related);
        else usedIn.push(related);
      }
    }
  }

  const onRefresh = async () => {
    if (!ownItemId) return;
    try {
      setRefreshing(true);
      await Promise.all([itemQuery.refetch(), movementsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const recipeLines = mode === "recipe" ? (option?.inventoryItems ?? []) : [];
  const title = product && option ? variantName(product, option) : "";

  const openRecipeEditor = () => {
    if (!product || !option) return;
    router.push({
      pathname: "/(profile)/menu/products/option-recipe",
      params: {
        productOptionId: String(option.id),
        productOptionName: option.name,
        productName: product.name,
      },
    });
  };

  const handleChooseMode = async (
    next: VariantStockMode,
    ownStock?: OwnStockInput,
  ) => {
    if (!option) return;
    try {
      if (next === "own") {
        await enable.mutateAsync({
          productOptionId: option.id,
          ...ownStock,
        });
      } else if (next === "recipe") {
        if (mode === "own") await disable.mutateAsync(option.id);
        modeSheetRef.current?.dismiss();
        openRecipeEditor();
        return;
      } else {
        await disable.mutateAsync(option.id);
      }
      modeSheetRef.current?.dismiss();
    } catch {
      // The mutation shows the error; the sheet stays to retry.
    }
  };

  const handleSaveMinimum = async () => {
    if (!option) return;
    const parsed = Number(minimum.replace(",", "."));
    const minimumQuantity =
      minimum.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    try {
      await enable.mutateAsync({ productOptionId: option.id, minimumQuantity });
      itemQuery.refetch();
      minimumSheetRef.current?.dismiss();
    } catch {
      // Shown by the mutation.
    }
  };

  const openMinimumSheet = () => {
    optionsSheetRef.current?.dismiss();
    setMinimum(
      ownItem?.minimumQuantity != null ? String(ownItem.minimumQuantity) : "",
    );
    minimumSheetRef.current?.present();
  };

  const ownActions: ActionsBottomSheetItem[] =
    mode === "own" && option
      ? [
          {
            icon: "bell",
            label: t("variant.actions.setMinimum"),
            onPress: openMinimumSheet,
          },
          ...(sharedWith.length > 0
            ? [
                {
                  icon: "split" as const,
                  label: t("variant.actions.separate"),
                  hint: t("variant.actions.separateHint"),
                  onPress: () => {
                    optionsSheetRef.current?.dismiss();
                    separate.mutate(option.id);
                  },
                },
              ]
            : []),
          {
            icon: "package",
            label: t("variant.actions.toIngredient"),
            hint: t("variant.actions.toIngredientHint"),
            onPress: () => {
              optionsSheetRef.current?.dismiss();
              setConfirmToIngredient(true);
            },
          },
        ]
      : [];

  const section = {
    product,
    option,
    title,
    canManage,
    mode,
    ownItemId,
    ownItem,
    itemQuery,
    movements,
    movementsQuery,
    sharedWith,
    usedIn,
    recipeLines,
    refreshing,
    onRefresh,
    openRecipeEditor,
    openMinimumSheet,
    /** Stock options (⋮): only for own stock, for whoever manages it. */
    hasOptions: canManage && mode === "own",
    openOptions: () => optionsSheetRef.current?.present(),
    openModeSheet: () => modeSheetRef.current?.present(),
    openAdjust: (next: "restock" | "decrease") => setAdjustMode(next),
    // Internals for VariantStockOverlays
    minimum,
    setMinimum,
    adjustMode,
    setAdjustMode,
    confirmToIngredient,
    setConfirmToIngredient,
    enable,
    disable,
    convertToIngredient,
    handleChooseMode,
    handleSaveMinimum,
    ownActions,
  };
  // Kept apart from the section, which is read during render.
  const sheets = { modeSheetRef, optionsSheetRef, minimumSheetRef };
  return [section, sheets] as const;
}

export type VariantStockSection = ReturnType<typeof useVariantStockSection>[0];
export type VariantStockSheets = ReturnType<typeof useVariantStockSection>[1];

const STATUS_LABEL_COLOR: Record<InventoryStockStatus, LabelProps["color"]> = {
  critical: "error",
  low: "warning",
  optimal: "success",
  noMinimum: "default",
  inactive: "default",
};

/**
 * The stock figure: own units with the minimum, what the recipe covers, or
 * that it isn't tracked. With `title`, it is the top of the variant screen
 * (name and price); without, a card under the product's own title.
 */
export function VariantStockOverview({
  section,
  title,
}: {
  section: VariantStockSection;
  title?: string;
}) {
  const { t } = useTranslation("inventory");
  const { option, mode, ownItem, itemQuery, canManage } = section;
  if (!option) return null;

  const available = getProductOptionAvailableQuantity(option);
  const level = getProductOptionStockLevel(option, available);
  const limitingLine = getLimitingRecipeLine(option);

  let body: ReactNode = null;
  if (mode === "own" && ownItem) {
    if (title)
      return (
        <InventoryDetailSummaryCard
          item={ownItem}
          icon="hamburger"
          title={title}
          subtitle={formatCurrency(option.price)}
          onSetMinimum={canManage ? section.openMinimumSheet : undefined}
        />
      );
    body = (
      <OwnStockCard
        item={ownItem}
        onSetMinimum={canManage ? section.openMinimumSheet : undefined}
      />
    );
  } else if (mode === "own") {
    body = itemQuery.isLoading ? (
      <ThemedText type="body2" style={tw`text-gray-500`}>
        {t("loading")}
      </ThemedText>
    ) : null;
  } else if (mode === "recipe") {
    body = (
      <Card>
        <ThemedView style={tw`gap-1 bg-transparent`}>
          <ThemedView
            style={tw`flex-row items-center justify-between bg-transparent`}
          >
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("variant.covers")}
            </ThemedText>
            {level === "out" && (
              <Label
                text={t("variant.outOfStock")}
                color="error"
                size="small"
              />
            )}
            {level === "low" && (
              <Label text={t("status.low")} color="warning" size="small" />
            )}
          </ThemedView>
          <ThemedText
            type="h1"
            style={[
              { fontFamily: typography.semibold },
              { fontVariant: ["tabular-nums"] },
            ]}
          >
            {Math.max(available ?? 0, 0)}
          </ThemedText>
          {limitingLine?.inventoryItem && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t(
                level === "out"
                  ? "variant.missingIngredient"
                  : "variant.limitingIngredient",
                {
                  name: limitingLine.inventoryItem.name,
                  stock: t("quantityWithUnit", {
                    quantity: limitingLine.inventoryItem.quantity,
                    unit: t(`units.${limitingLine.inventoryItem.unit}`, {
                      count: limitingLine.inventoryItem.quantity,
                    }),
                  }),
                  used: t("quantityWithUnit", {
                    quantity: limitingLine.quantity,
                    unit: t(`units.${limitingLine.inventoryItem.unit}`, {
                      count: limitingLine.quantity,
                    }),
                  }),
                },
              )}
            </ThemedText>
          )}
        </ThemedView>
      </Card>
    );
  } else {
    // Not tracked: one card that says so and leads to set it up
    body = (
      <Card>
        <ThemedView style={tw`gap-4 bg-transparent`}>
          <ThemedView style={tw`flex-row items-start gap-3 bg-transparent`}>
            <Icon name="package" size={22} color={tw.color("on-surface")} />
            <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
              <ThemedText
                type="body1"
                style={{ fontFamily: typography.semibold }}
              >
                {t("variant.inventory.title")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("variant.inventory.description")}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          {canManage && (
            <Button
              label={t("variant.inventory.manage")}
              onPress={section.openModeSheet}
            />
          )}
        </ThemedView>
      </Card>
    );
  }

  if (!title) return <>{body}</>;
  return (
    <ThemedView style={tw`gap-4 bg-transparent`}>
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <ThemedText type="h1">{title}</ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {formatCurrency(option.price)}
        </ThemedText>
      </ThemedView>
      {body}
    </ThemedView>
  );
}

/** Own stock as a card, for the product screen (it has its own title). */
function OwnStockCard({
  item,
  onSetMinimum,
}: {
  item: InventoryItem;
  onSetMinimum?: () => void;
}) {
  const { t } = useTranslation("inventory");
  const stockStatus = getInventoryStockStatus({ ...item, isActive: true });
  const unitLabel = t(`units.${item.unit}`, { count: item.quantity });

  return (
    <Card>
      <ThemedView style={tw`gap-1 bg-transparent`}>
        <ThemedView
          style={tw`flex-row items-center justify-between bg-transparent`}
        >
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("detail.currentStock")}
          </ThemedText>
          <Label
            text={t(`status.${stockStatus}`)}
            color={STATUS_LABEL_COLOR[stockStatus]}
            size="small"
          />
        </ThemedView>
        <ThemedView style={tw`flex-row items-baseline gap-1.5 bg-transparent`}>
          <ThemedText
            type="h1"
            style={[
              { fontFamily: typography.semibold },
              { fontVariant: ["tabular-nums"] },
            ]}
          >
            {item.quantity}
          </ThemedText>
          <ThemedText type="body1" style={tw`text-on-surface-variant`}>
            {unitLabel}
          </ThemedText>
        </ThemedView>
        {item.quantity < 0 && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("detail.negativeStockHint")}
          </ThemedText>
        )}
        <ThemedView
          style={tw`flex-row items-baseline gap-2 pt-3 mt-2 border-t border-divider bg-transparent`}
        >
          <ThemedText type="small" style={tw`text-gray-500 flex-1`}>
            {t("detail.minimumStock")}
          </ThemedText>
          {item.minimumQuantity ? (
            <ThemedText type="body2" style={{ fontFamily: typography.medium }}>
              {t("quantityWithUnit", {
                quantity: item.minimumQuantity,
                unit: t(`units.${item.unit}`, {
                  count: item.minimumQuantity,
                }),
              })}
            </ThemedText>
          ) : onSetMinimum ? (
            <Button
              label={t("detail.setMinimum")}
              variant="text"
              size="extra-small"
              onPress={onSetMinimum}
            />
          ) : (
            <ThemedText type="body2" style={{ fontFamily: typography.medium }}>
              {t("detail.minimumNotSet")}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
    </Card>
  );
}

/** Disminuir / Reabastecer. Stock movements are open to every role. */
export function VariantAdjustButtons({
  section,
}: {
  section: VariantStockSection;
}) {
  const { t } = useTranslation("inventory");
  if (section.mode !== "own" || !section.ownItem) return null;
  return (
    <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
      <Button
        label={t("decrease")}
        leftIcon="minus"
        variant="outline"
        onPress={() => section.openAdjust("decrease")}
        style={tw`flex-1`}
      />
      <Button
        label={t("restock")}
        leftIcon="plus"
        onPress={() => section.openAdjust("restock")}
        style={tw`flex-1`}
      />
    </ThemedView>
  );
}

/**
 * How the stock is tracked, then the recipe and the variants that use this
 * one. Returned as siblings, so they take the parent's spacing.
 */
export function VariantStockDetails({
  section,
}: {
  section: VariantStockSection;
}) {
  const { t } = useTranslation("inventory");
  const products = useMenuStore((state) => state.products);
  const { mode, canManage, sharedWith, usedIn, recipeLines } = section;
  if (!section.option) return null;

  return (
    <>
      {/* How the stock is tracked; changing it is the main setting here.
          Not tracked, the inventory card above leads there instead. */}
      {mode !== "none" && (
        <Card onPress={canManage ? section.openModeSheet : undefined}>
          <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
            <Icon
              name={
                mode === "own"
                  ? "hash"
                  : mode === "recipe"
                    ? "chef-hat"
                    : "circle-off"
              }
              size={22}
              color={tw.color("on-surface")}
            />
            <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
              <ThemedText
                type="body2"
                style={{ fontFamily: typography.semibold }}
              >
                {t(`variant.mode.${mode}.label`)}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t(`variant.mode.${mode}.short`)}
              </ThemedText>
            </ThemedView>
            {canManage && (
              <Icon
                name="chevron-right"
                size={18}
                color={tw.color("gray-400")}
              />
            )}
          </ThemedView>
        </Card>
      )}

      {sharedWith.length > 0 && (
        <ThemedText type="small" style={tw`text-gray-500 -mt-2`}>
          {t("variant.sharedWith", {
            names: sharedWith
              .map((related) => variantName(related.product, related.option))
              .join(", "),
          })}
        </ThemedText>
      )}

      {mode === "recipe" && (
        <ThemedView style={tw`gap-2 bg-transparent`}>
          <InventorySectionHeader
            title={t("variant.recipe")}
            count={recipeLines.length}
            right={
              canManage ? (
                <Button
                  label={t("common:actions.edit")}
                  leftIcon="square-pen"
                  variant="text"
                  size="extra-small"
                  onPress={section.openRecipeEditor}
                />
              ) : undefined
            }
          />
          <GroupedList
            data={recipeLines}
            keyExtractor={(line) => getLineItemId(line) ?? line.id}
            onItemPress={(line) => {
              const itemId = getLineItemId(line);
              if (!itemId) return;
              if (isProductStockItem(line.inventoryItem)) {
                const owner = products
                  .flatMap((p) => p.options ?? [])
                  .find((o) => {
                    const own = getOwnStockLine(o.inventoryItems);
                    return own && getLineItemId(own) === itemId;
                  });
                if (owner) {
                  openVariant(owner.id);
                  return;
                }
              }
              router.push({
                pathname: "/(profile)/inventory/items/detail",
                params: { itemId },
              });
            }}
            renderItem={(line) => <RecipeLine line={line} />}
          />
        </ThemedView>
      )}

      {usedIn.length > 0 && (
        <ThemedView style={tw`gap-2 bg-transparent`}>
          <InventorySectionHeader
            title={t("variant.usedIn")}
            count={usedIn.length}
          />
          <GroupedList
            data={usedIn}
            keyExtractor={(related) => String(related.option.id)}
            onItemPress={(related) => openVariant(related.option.id)}
            renderItem={(related) => (
              <ThemedView
                style={tw`flex-row items-center justify-between gap-3 bg-transparent`}
              >
                <ThemedText
                  type="body2"
                  style={[tw`flex-1`, { fontFamily: typography.medium }]}
                  numberOfLines={1}
                >
                  {variantName(related.product, related.option)}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("variant.perSale", { count: related.line.quantity })}
                </ThemedText>
              </ThemedView>
            )}
          />
        </ThemedView>
      )}
    </>
  );
}

/** Movements of the variant's own stock (needs the network). */
export function VariantStockMovements({
  section,
}: {
  section: VariantStockSection;
}) {
  const { t } = useTranslation("inventory");
  const { mode, ownItem, movements, movementsQuery } = section;
  if (mode !== "own" || !ownItem) return null;
  return (
    <InventoryMovementHistory
      movements={movements}
      unit={ownItem.unit}
      loading={movementsQuery.isLoading}
      error={
        movementsQuery.isError ? t("detail.movementsLoadError") : undefined
      }
    />
  );
}

/** The sheets and modals the section opens; render once, outside scrolls. */
export function VariantStockOverlays({
  section,
  sheets,
}: {
  section: VariantStockSection;
  sheets: VariantStockSheets;
}) {
  const { t } = useTranslation("inventory");
  const { option, mode, ownItem } = section;
  const { modeSheetRef, optionsSheetRef, minimumSheetRef } = sheets;
  if (!option) return null;

  return (
    <>
      <AdjustStockModal
        item={section.adjustMode && ownItem ? ownItem : null}
        initialMode={section.adjustMode ?? "restock"}
        onClose={() => section.setAdjustMode(null)}
      />

      <StockModeSheet
        key={`${option.id}-${mode}`}
        sheetRef={modeSheetRef}
        currentMode={mode}
        ownStock={ownItem?.quantity ?? 0}
        recipeLineCount={section.recipeLines.length}
        loading={section.enable.isPending || section.disable.isPending}
        onChoose={section.handleChooseMode}
      />

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("variant.actions.title")}
          subtitle={section.title}
          items={section.ownActions}
        />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={minimumSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">{t("variant.actions.setMinimum")}</ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("variant.minimumHint")}
          </ThemedText>
          <TextInput
            bottomSheet
            label={t("detail.minimumStock")}
            placeholder="0"
            value={section.minimum}
            onChangeText={section.setMinimum}
            keyboardType="decimal-pad"
          />
          <Button
            label={t("save")}
            onPress={section.handleSaveMinimum}
            loading={section.enable.isPending}
            disabled={section.enable.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <DialogModal
        visible={section.confirmToIngredient}
        title={t("variant.actions.toIngredient")}
        message={t("variant.actions.toIngredientMessage", {
          name: ownItem?.name ?? section.title,
        })}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        loading={section.convertToIngredient.isPending}
        onConfirm={() =>
          section.convertToIngredient.mutate(option.id, {
            onSettled: () => section.setConfirmToIngredient(false),
          })
        }
        onCancel={() => section.setConfirmToIngredient(false)}
      />
    </>
  );
}

/** A recipe line: the insumo, what one sale uses, and what is left. */
function RecipeLine({ line }: { line: ProductOptionInventoryItem }) {
  const { t } = useTranslation("inventory");
  const stockItem = line.inventoryItem;
  const unit = (count: number) =>
    stockItem ? t(`units.${stockItem.unit}`, { count }) : "";
  const covers =
    stockItem && line.quantity > 0
      ? Math.floor(stockItem.quantity / line.quantity)
      : 0;
  const isLow =
    !!stockItem?.minimumQuantity &&
    stockItem.minimumQuantity > 0 &&
    stockItem.quantity <= stockItem.minimumQuantity;

  return (
    <ThemedView style={tw`flex-row items-center gap-3 bg-transparent`}>
      <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
        <ThemedText
          type="body2"
          style={{ fontFamily: typography.medium }}
          numberOfLines={1}
        >
          {stockItem?.name ?? t("detail.unknownProduct")}
        </ThemedText>
        {stockItem && (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("variant.hasStock", {
              stock: t("quantityWithUnit", {
                quantity: stockItem.quantity,
                unit: unit(stockItem.quantity),
              }),
            })}
          </ThemedText>
        )}
      </ThemedView>
      <ThemedText type="body2" style={{ fontFamily: typography.semibold }}>
        {t("quantityWithUnit", {
          quantity: line.quantity,
          unit: unit(line.quantity),
        })}
      </ThemedText>
      {covers <= 0 ? (
        <Label text={t("variant.missing")} color="error" size="small" />
      ) : isLow ? (
        <Label text={t("status.low")} color="warning" size="small" />
      ) : null}
    </ThemedView>
  );
}
