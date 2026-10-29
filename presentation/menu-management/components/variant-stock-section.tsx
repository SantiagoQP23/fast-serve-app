import { useRef, useState } from "react";
import { Pressable } from "react-native";
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
import Button from "@/presentation/theme/components/button";
import Icon from "@/presentation/theme/components/icon";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import TextInput from "@/presentation/theme/components/text-input";
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
import InventoryMovementHistory from "@/presentation/inventory/components/inventory-movement-history";
import { InventoryStockCard } from "@/presentation/inventory/components/inventory-stock-card";
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import Skeleton from "@/presentation/theme/components/skeleton";
import StockModeSheet, {
  type OwnStockInput,
} from "@/presentation/menu-management/components/stock-mode-sheet";
import {
  getLineItemId,
  getOwnStockLine,
  type ProductOptionInventoryItem,
} from "@/core/inventory/models/inventory-recipe.model";
import {
  isProductStockItem,
  type InventoryItem,
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

/**
 * "Producto · Variante", or just the product's name when this is its only
 * active variant. An inactive variant keeps its name, so it can be told
 * apart from the one still on sale. Doesn't rely on `hasVariants`, which
 * products from before variants existed may still have off.
 */
export const variantName = (product: Product, option: ProductOption) =>
  option.isActive &&
  product.options.every((o) => o.id === option.id || !o.isActive)
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
    if (!option) return false;
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
        return true;
      } else {
        await disable.mutateAsync(option.id);
      }
      modeSheetRef.current?.dismiss();
      return true;
    } catch {
      // The mutation shows the error; the sheet stays to retry.
      return false;
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

  const modeAction: ActionsBottomSheetItem = {
    icon:
      mode === "own" ? "hash" : mode === "recipe" ? "chef-hat" : "circle-off",
    label: t("variant.actions.changeMode"),
    onPress: () => {
      optionsSheetRef.current?.dismiss();
      modeSheetRef.current?.present();
    },
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
    modeAction,
    ownActions,
  };
  // Kept apart from the section, which is read during render.
  const sheets = { modeSheetRef, optionsSheetRef, minimumSheetRef };
  return [section, sheets] as const;
}

export type VariantStockSection = ReturnType<typeof useVariantStockSection>[0];
export type VariantStockSheets = ReturnType<typeof useVariantStockSection>[1];

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

/**
 * The variant screen's sections as titled cards, like the inventory item
 * screen: own stock (with who else uses it and its movements), what the
 * recipe covers and its lines, or that it isn't tracked.
 */
export function VariantStockCards({
  section,
  showMovements = true,
}: {
  section: VariantStockSection;
  /** Off where the screen puts VariantStockMovements further down. */
  showMovements?: boolean;
}) {
  const { t } = useTranslation("inventory");
  const { option, mode, ownItem, itemQuery, canManage, sharedWith, usedIn } =
    section;
  if (!option) return null;

  if (mode === "none")
    return (
      <ThemedView style={tw`gap-3 mt-4`}>
        <DetailSectionTitle title={t("variant.inventory.title")} />
        <DetailCard style={tw`py-4`}>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("variant.inventory.description")}
          </ThemedText>
        </DetailCard>
      </ThemedView>
    );

  if (mode === "recipe") {
    const available = getProductOptionAvailableQuantity(option);
    const level = getProductOptionStockLevel(option, available);
    const limitingLine = getLimitingRecipeLine(option);
    const limitingItem = limitingLine?.inventoryItem;
    return (
      <>
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle title={t("variant.covers")} />
          <DetailCard style={tw`py-4 gap-1`}>
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <ThemedText
                type="h1"
                style={[
                  tw`flex-1`,
                  { fontFamily: typography.semibold },
                  { fontVariant: ["tabular-nums"] },
                ]}
              >
                {Math.max(available ?? 0, 0)}
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
            {limitingLine && limitingItem && (
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t(
                  level === "out"
                    ? "variant.missingIngredient"
                    : "variant.limitingIngredient",
                  {
                    name: limitingItem.name,
                    stock: t("quantityWithUnit", {
                      quantity: limitingItem.quantity,
                      unit: t(`units.${limitingItem.unit}`, {
                        count: limitingItem.quantity,
                      }),
                    }),
                    used: t("quantityWithUnit", {
                      quantity: limitingLine.quantity,
                      unit: t(`units.${limitingItem.unit}`, {
                        count: limitingLine.quantity,
                      }),
                    }),
                  },
                )}
              </ThemedText>
            )}
          </DetailCard>
        </ThemedView>

        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle
            title={t("variant.recipe")}
            action={
              canManage && (
                <Button
                  label={t("common:actions.edit")}
                  leftIcon="square-pen"
                  variant="outline"
                  size="extra-small"
                  onPress={section.openRecipeEditor}
                />
              )
            }
          />
          <DetailCard style={tw`py-2`}>
            {section.recipeLines.map((line, index, lines) => (
              <Pressable
                key={getLineItemId(line) ?? line.id}
                onPress={() => openRecipeLine(line)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  tw`py-3`,
                  index < lines.length - 1 && tw`border-b border-divider`,
                  pressed && tw`opacity-60`,
                ]}
              >
                <RecipeLine line={line} />
              </Pressable>
            ))}
          </DetailCard>
        </ThemedView>
      </>
    );
  }

  // Own stock, still on its way from the server
  if (!ownItem)
    return itemQuery.isLoading ? (
      <Skeleton style={tw`h-40 mt-4 rounded-2xl`} />
    ) : null;

  return (
    <>
      <InventoryStockCard
        item={ownItem}
        onSetMinimum={canManage ? section.openMinimumSheet : undefined}
        footnote={
          sharedWith.length > 0
            ? t("variant.sharedWith", {
                names: sharedWith
                  .map((related) =>
                    variantName(related.product, related.option),
                  )
                  .join(", "),
              })
            : undefined
        }
      />

      {usedIn.length > 0 && (
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle title={t("variant.usedIn")} />
          <DetailCard style={tw`py-2`}>
            {usedIn.map((related, index) => (
              <Pressable
                key={related.option.id}
                onPress={() => openVariant(related.option.id)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  tw`flex-row items-center gap-3 py-3`,
                  index < usedIn.length - 1 && tw`border-b border-divider`,
                  pressed && tw`opacity-60`,
                ]}
              >
                <ThemedText style={tw`flex-1`} numberOfLines={1}>
                  {variantName(related.product, related.option)}
                </ThemedText>
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("variant.perSale", { count: related.line.quantity })}
                </ThemedText>
                <Icon
                  name="chevron-right"
                  size={18}
                  color={tw.color("gray-400")}
                />
              </Pressable>
            ))}
          </DetailCard>
        </ThemedView>
      )}

      {showMovements && <VariantStockMovements section={section} />}
    </>
  );
}

/** The sheets and modals the section opens; render once, outside scrolls. */
export function VariantStockOverlays({
  section,
  sheets,
  variantActions = [],
  showModeAction = false,
  optionsTitle,
}: {
  section: VariantStockSection;
  sheets: VariantStockSheets;
  /** The variant's own actions (edit, delete…), above the stock ones. */
  variantActions?: ActionsBottomSheetItem[];
  /** Changing the stock type from the sheet, where no card or button does. */
  showModeAction?: boolean;
  /** Title of the options sheet, e.g. when it holds the product's actions. */
  optionsTitle?: string;
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
          title={
            optionsTitle ??
            (variantActions.length > 0
              ? t("menuManagement:products.variants.actions")
              : t("variant.actions.title"))
          }
          subtitle={section.title}
          sections={[
            { items: variantActions },
            {
              items:
                showModeAction && section.canManage
                  ? [section.modeAction, ...section.ownActions]
                  : section.ownActions,
            },
          ]}
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

/** An insumo opens its detail; another variant's own stock, that variant. */
function openRecipeLine(line: ProductOptionInventoryItem) {
  const itemId = getLineItemId(line);
  if (!itemId) return;
  if (isProductStockItem(line.inventoryItem)) {
    const owner = useMenuStore
      .getState()
      .products.flatMap((p) => p.options ?? [])
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
}

/** A recipe line: the insumo, what one sale uses, and whether it runs short. */
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
      <ThemedText
        type="body2"
        style={[tw`flex-1`, { fontFamily: typography.medium }]}
        numberOfLines={1}
      >
        {stockItem?.name ?? t("detail.unknownProduct")}
      </ThemedText>
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
