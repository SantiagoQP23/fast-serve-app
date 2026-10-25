import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Icon from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
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
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
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

interface VariantDetailViewProps {
  productOptionId: number;
  /** Rendered as a pane (tablet): close button instead of back. */
  embedded?: boolean;
  onClose?: () => void;
  /** Opens the stock mode sheet on arrival, e.g. from "Gestionar stock". */
  openStockMode?: boolean;
}

/** Another variant that uses the same item, as "Producto · Variante". */
interface RelatedVariant {
  option: ProductOption;
  product: Product;
  line: ProductOptionInventoryItem;
}

const variantName = (product: Product, option: ProductOption) =>
  product.hasVariants === false || product.options.length <= 1
    ? product.name
    : `${product.name} · ${option.name}`;

const openVariant = (productOptionId: number) =>
  router.push({
    pathname: "/(profile)/menu/products/variant",
    params: { productOptionId: String(productOptionId) },
  });

/**
 * One menu variant and its stock: its own units (with movements and
 * restock / decrease, like an inventory item), or what its recipe covers
 * and each insumo's stock, or that it isn't tracked.
 */
export default function VariantDetailView({
  productOptionId,
  embedded = false,
  onClose,
  openStockMode = false,
}: VariantDetailViewProps) {
  const { t } = useTranslation("inventory");
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const canManage = canManageInventory(user?.role?.name);
  const products = useMenuStore((state) => state.products);
  const { enable, disable, separate, convertToIngredient } = useVariantStock();

  const product = products.find((p) =>
    p.options?.some((option) => option.id === productOptionId),
  );
  const option = product?.options.find((o) => o.id === productOptionId);

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

  // Only once: closing the sheet shouldn't bring it back
  const openedStockMode = useRef(false);
  const hasOption = !!option;
  useEffect(() => {
    if (!openStockMode || !canManage || !hasOption || openedStockMode.current)
      return;
    openedStockMode.current = true;
    modeSheetRef.current?.present();
  }, [openStockMode, canManage, hasOption]);
  const [refreshing, setRefreshing] = useState(false);

  const Container = embedded ? ThemedView : ScreenLayout;
  const close = onClose ?? (() => router.back());

  // Other variants using this variant's own stock: sharing it as their own
  // stock, or using it in a recipe (a combo).
  const sharedWith: RelatedVariant[] = [];
  const usedIn: RelatedVariant[] = [];
  if (ownItemId) {
    for (const p of products) {
      for (const o of p.options ?? []) {
        if (o.id === productOptionId || !o.isActive) continue;
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

  if (!product || !option) {
    return (
      <Container style={tw`flex-1 px-4 pt-8 bg-background`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
        />
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("gray-400")} />
          <ThemedText type="body1" style={tw`text-gray-500 text-center`}>
            {t("variant.notFound")}
          </ThemedText>
        </ThemedView>
      </Container>
    );
  }

  const title = variantName(product, option);
  const recipeLines = mode === "recipe" ? (option.inventoryItems ?? []) : [];

  const openRecipeEditor = () =>
    router.push({
      pathname: "/(profile)/menu/products/option-recipe",
      params: {
        productOptionId: String(option.id),
        productOptionName: option.name,
        productName: product.name,
      },
    });

  const handleChooseMode = async (
    next: VariantStockMode,
    ownStock?: OwnStockInput,
  ) => {
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
    mode === "own"
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

  const available = getProductOptionAvailableQuantity(option);
  const level = getProductOptionStockLevel(option, available);
  const limitingLine = getLimitingRecipeLine(option);

  return (
    <Container style={tw`flex-1 bg-background`}>
      <ThemedView style={tw`px-4 ${embedded ? "pt-2" : "pt-6"} bg-transparent`}>
        <InventoryScreenHeader
          onBack={close}
          backIcon={embedded ? "x" : "arrow-left"}
          right={
            canManage && mode === "own" ? (
              <IconButton
                icon="ellipsis-vertical"
                onPress={() => optionsSheetRef.current?.present()}
                accessibilityLabel={t("options")}
                style={tw`-mr-3`}
              />
            ) : undefined
          }
        />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 gap-8 pt-6 pb-10`}
        refreshControl={
          ownItemId ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tw.color("primary")}
              colors={[tw.color("primary") as string]}
            />
          ) : undefined
        }
      >
        {mode === "own" && ownItem ? (
          <InventoryDetailSummaryCard
            item={ownItem}
            icon="hamburger"
            title={title}
            subtitle={formatCurrency(option.price)}
            onSetMinimum={canManage ? openMinimumSheet : undefined}
          />
        ) : (
          <ThemedView style={tw`gap-4 bg-transparent`}>
            <ThemedView style={tw`gap-1 bg-transparent`}>
              <ThemedText type="h1">{title}</ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {formatCurrency(option.price)}
              </ThemedText>
            </ThemedView>

            {mode === "recipe" && (
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
                      <Label
                        text={t("status.low")}
                        color="warning"
                        size="small"
                      />
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
                            unit: t(
                              `units.${limitingLine.inventoryItem.unit}`,
                              {
                                count: limitingLine.inventoryItem.quantity,
                              },
                            ),
                          }),
                          used: t("quantityWithUnit", {
                            quantity: limitingLine.quantity,
                            unit: t(
                              `units.${limitingLine.inventoryItem.unit}`,
                              {
                                count: limitingLine.quantity,
                              },
                            ),
                          }),
                        },
                      )}
                    </ThemedText>
                  )}
                </ThemedView>
              </Card>
            )}

            {/* Not tracked: one card that says so and leads to set it up */}
            {mode === "none" && (
              <Card>
                <ThemedView style={tw`gap-4 bg-transparent`}>
                  <ThemedView
                    style={tw`flex-row items-start gap-3 bg-transparent`}
                  >
                    <Icon
                      name="package"
                      size={22}
                      color={tw.color("on-surface")}
                    />
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
                      onPress={() => modeSheetRef.current?.present()}
                    />
                  )}
                </ThemedView>
              </Card>
            )}
          </ThemedView>
        )}

        {mode === "own" && !ownItem && itemQuery.isLoading && (
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("loading")}
          </ThemedText>
        )}

        {/* How the stock is tracked; changing it is the main setting here.
            Not tracked, the inventory card above leads there instead. */}
        {mode !== "none" && (
          <Card
            onPress={
              canManage ? () => modeSheetRef.current?.present() : undefined
            }
          >
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
          <ThemedText type="small" style={tw`text-gray-500 -mt-4`}>
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
                    onPress={openRecipeEditor}
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

        {mode === "own" && ownItem && (
          <InventoryMovementHistory
            movements={movements}
            unit={ownItem.unit}
            loading={movementsQuery.isLoading}
            error={
              movementsQuery.isError
                ? t("detail.movementsLoadError")
                : undefined
            }
          />
        )}
      </ScrollView>

      {/* Stock movements are open to every role, like on insumos */}
      {mode === "own" && ownItem && (
        <ThemedView
          style={[
            tw`flex-row items-center gap-3 px-4 pt-3 border-t border-divider bg-background`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          <Button
            label={t("decrease")}
            leftIcon="minus"
            variant="outline"
            onPress={() => setAdjustMode("decrease")}
            style={tw`flex-1`}
          />
          <Button
            label={t("restock")}
            leftIcon="plus"
            onPress={() => setAdjustMode("restock")}
            style={tw`flex-1`}
          />
        </ThemedView>
      )}

      <AdjustStockModal
        item={adjustMode && ownItem ? ownItem : null}
        initialMode={adjustMode ?? "restock"}
        onClose={() => setAdjustMode(null)}
      />

      <StockModeSheet
        key={`${option.id}-${mode}`}
        sheetRef={modeSheetRef}
        currentMode={mode}
        ownStock={ownItem?.quantity ?? 0}
        recipeLineCount={recipeLines.length}
        loading={enable.isPending || disable.isPending}
        onChoose={handleChooseMode}
      />

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={t("variant.actions.title")}
          subtitle={title}
          items={ownActions}
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
            value={minimum}
            onChangeText={setMinimum}
            keyboardType="decimal-pad"
          />
          <Button
            label={t("save")}
            onPress={handleSaveMinimum}
            loading={enable.isPending}
            disabled={enable.isPending}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <DialogModal
        visible={confirmToIngredient}
        title={t("variant.actions.toIngredient")}
        message={t("variant.actions.toIngredientMessage", {
          name: ownItem?.name ?? title,
        })}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        loading={convertToIngredient.isPending}
        onConfirm={() =>
          convertToIngredient.mutate(option.id, {
            onSettled: () => setConfirmToIngredient(false),
          })
        }
        onCancel={() => setConfirmToIngredient(false)}
      />
    </Container>
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
