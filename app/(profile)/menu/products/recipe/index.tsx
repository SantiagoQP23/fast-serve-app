import { useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  NestedReorderableList,
  ScrollViewContainer,
  reorderItems,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { toast } from "sonner-native";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import DetailHeader from "@/presentation/theme/components/detail-header";
import { DetailCard } from "@/presentation/theme/components/detail-card";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  canManageInventory,
  isAdminLevelRole,
} from "@/core/auth/models/user.model";
import { useInventoryItems } from "@/presentation/inventory/hooks/useInventoryItems";
import { useProductRecipe } from "@/presentation/inventory/hooks/useProductRecipe";
import RecipeIngredientSheet, {
  type RecipeIngredientDraft,
  type RecipeIngredientSheetRef,
} from "@/presentation/inventory/components/recipe-ingredient-sheet";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { getProductOptionAvailableQuantity } from "@/core/menu/models/product-optionl.model";
import {
  getInventoryStockStatus,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";
import type { ProductRecipe } from "@/presentation/inventory/services/product-recipe.service";

const fromRecipe = (recipe: ProductRecipe): RecipeIngredientDraft[] =>
  recipe.lines.map((line) => ({
    inventoryItemId: line.inventoryItemId,
    inventoryItem: line.inventoryItem,
    removable: line.removable,
    discount: Number(line.removalPriceDelta)
      ? String(Math.abs(Number(line.removalPriceDelta)))
      : "",
    quantities: Object.fromEntries(
      line.quantities.map((entry) => [
        entry.productOptionId,
        entry.quantity === null ? "" : String(Number(entry.quantity)),
      ]),
    ),
  }));

/** Compares drafts by content. */
const snapshot = (lines: RecipeIngredientDraft[]) =>
  JSON.stringify(
    lines.map(({ inventoryItem, ...line }) => ({
      ...line,
      quantities: Object.entries(line.quantities).sort(),
    })),
  );

/** One ingredient: tapped to edit, long-pressed to move. */
function IngredientRow({
  line,
  amounts,
  isFirst,
  isLast,
  canEdit,
  onPress,
  onMove,
}: {
  line: RecipeIngredientDraft;
  /** Amount per shown variant, in variant order ("150 g", "—"). */
  amounts: string;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  onPress: () => void;
  onMove: (delta: number) => void;
}) {
  const { t } = useTranslation("inventory");
  const drag = useReorderableDrag();
  const discount = parseAmount(line.discount);
  const status = getInventoryStockStatus(line.inventoryItem);

  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      onLongPress={canEdit ? drag : undefined}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`${line.inventoryItem.name}, ${amounts}`}
      accessibilityActions={
        canEdit
          ? [
              ...(isFirst
                ? []
                : [{ name: "moveUp", label: t("productRecipe.moveUp") }]),
              ...(isLast
                ? []
                : [{ name: "moveDown", label: t("productRecipe.moveDown") }]),
            ]
          : undefined
      }
      onAccessibilityAction={(event) =>
        onMove(event.nativeEvent.actionName === "moveUp" ? -1 : 1)
      }
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-3 py-3 min-h-16",
          !isLast && "border-b border-divider",
          pressed && "opacity-70",
        )
      }
    >
      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
        <ThemedText style={{ fontFamily: typography.medium }} numberOfLines={2}>
          {line.inventoryItem.name}
        </ThemedText>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {amounts}
        </ThemedText>
        {(line.removable ||
          line.inventoryItem.isUnlimited ||
          status === "critical" ||
          status === "low") && (
          <ThemedView style={tw`flex-row flex-wrap gap-1.5 bg-transparent`}>
            {line.removable && (
              <Label
                size="small"
                color="info"
                text={
                  discount > 0
                    ? `${t("productRecipe.removable")} · −${formatCurrency(discount)}`
                    : t("productRecipe.removable")
                }
              />
            )}
            {line.inventoryItem.isUnlimited && (
              <Label size="small" color="default" text={t("unlimited.label")} />
            )}
            {status === "critical" && (
              <Label size="small" color="error" text={t("productRecipe.out")} />
            )}
            {status === "low" && (
              <Label
                size="small"
                color="warning"
                text={t("productRecipe.low")}
              />
            )}
          </ThemedView>
        )}
      </ThemedView>
      {canEdit && (
        <Icon name="grip-vertical" size={20} color={tw.color("gray-400")} />
      )}
    </Pressable>
  );
}

/**
 * A product's recipe, every variant on one screen
 * (plans/unificar-receta-incluidos.md): what each variant uses, what the
 * customer can ask to leave out, and which insumos aren't counted.
 */
export default function ProductRecipeScreen() {
  const { t } = useTranslation(["inventory", "common"]);
  const params = useLocalSearchParams<{
    productId: string;
    variantId?: string;
  }>();
  const productId = params.productId;
  const { user } = useAuthStore();
  const canEdit = canManageInventory(user?.role?.name);
  const canSetRemovals = isAdminLevelRole(user?.role?.name);
  const product = useMenuStore((state) =>
    state.products.find((item) => item.id === productId),
  );
  const { recipeQuery, recipe, saveRecipe } = useProductRecipe(productId);
  const { items, createItem } = useInventoryItems();

  const [lines, setLines] = useState<RecipeIngredientDraft[] | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    params.variantId ? Number(params.variantId) : null,
  );
  const [leaving, setLeaving] = useState(false);
  const sheetRef = useRef<RecipeIngredientSheetRef>(null);

  // First load (and a reload with nothing pending) fills the draft.
  if (recipe && (lines === null || snapshot(lines) === saved)) {
    const fresh = fromRecipe(recipe);
    const freshSnapshot = snapshot(fresh);
    if (freshSnapshot !== saved) {
      setLines(fresh);
      setSaved(freshSnapshot);
    }
  }

  const draft = useMemo(() => lines ?? [], [lines]);
  const dirty = lines !== null && snapshot(draft) !== saved;

  // Inactive variants keep their recipe but aren't shown as chips.
  const variants = useMemo(
    () =>
      (recipe?.variants ?? []).filter(
        (variant) =>
          variant.isActive ||
          draft.some((line) => line.quantities[variant.id] !== undefined),
      ),
    [recipe, draft],
  );
  const shownVariants = selectedVariant
    ? variants.filter((variant) => variant.id === selectedVariant)
    : variants;
  const visibleLines = selectedVariant
    ? draft.filter((line) => line.quantities[selectedVariant] !== undefined)
    : draft;

  const unitOf = (item: InventoryItem, amount: number) =>
    t(`units.${item.unit}`, { count: amount });
  const amountsOf = (line: RecipeIngredientDraft) =>
    shownVariants
      .map((variant) => {
        const raw = line.quantities[variant.id];
        if (raw === undefined) return "—";
        if (raw === "") return t("productRecipe.noAmountShort");
        const amount = parseAmount(raw);
        return `${amount} ${unitOf(line.inventoryItem, amount)}`;
      })
      .join(" · ");

  const available = (product?.options ?? [])
    .filter((option) => shownVariants.some((v) => v.id === option.id))
    .map((option) => ({
      name: option.name,
      count: getProductOptionAvailableQuantity(option),
    }))
    .filter((entry) => entry.count !== null);

  const handleSubmit = (ingredient: RecipeIngredientDraft, isNew: boolean) =>
    setLines((current) =>
      isNew
        ? [...(current ?? []), ingredient]
        : (current ?? []).map((line) =>
            line.inventoryItemId === ingredient.inventoryItemId
              ? ingredient
              : line,
          ),
    );

  const handleRemove = (ingredient: RecipeIngredientDraft) => {
    const index = draft.findIndex(
      (line) => line.inventoryItemId === ingredient.inventoryItemId,
    );
    if (index === -1) return;
    setLines((current) =>
      (current ?? []).filter(
        (line) => line.inventoryItemId !== ingredient.inventoryItemId,
      ),
    );
    let undone = false;
    const toastId = toast(
      t("productRecipe.removed", { name: ingredient.inventoryItem.name }),
      {
        duration: 8000,
        action: {
          label: t("common:actions.undo"),
          onClick: () => {
            if (undone) return;
            undone = true;
            toast.dismiss(toastId);
            setLines((current) => {
              const next = [...(current ?? [])];
              next.splice(Math.min(index, next.length), 0, ingredient);
              return next;
            });
          },
        },
      },
    );
  };

  const move = (index: number, delta: number) =>
    setLines((current) => {
      const list = current ?? [];
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      return reorderItems(list, index, target);
    });

  const handleSave = async () => {
    const recipeSaved = await saveRecipe
      .mutateAsync({
        lines: draft.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          removable: line.removable,
          removalPriceDelta:
            line.removable && line.discount !== ""
              ? -Math.abs(parseAmount(line.discount))
              : 0,
          quantities: Object.entries(line.quantities).map(
            ([variantId, raw]) => ({
              productOptionId: Number(variantId),
              quantity: raw.trim() === "" ? null : parseAmount(raw),
            }),
          ),
        })),
      })
      .catch(() => null);
    if (!recipeSaved) return;
    const fresh = fromRecipe(recipeSaved);
    setLines(fresh);
    setSaved(snapshot(fresh));
    toast.success(t("productRecipe.saved"));
  };

  const goBack = () => (dirty ? setLeaving(true) : router.back());

  const title = recipe?.productName ?? product?.name ?? "";

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8 bg-background`}>
      <ThemedView style={tw`items-center flex-row mb-6`}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          hitSlop={12}
          style={({ pressed }) => tw.style(pressed && "opacity-70")}
        >
          <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
        </Pressable>
      </ThemedView>

      <ScrollViewContainer
        contentContainerStyle={tw`gap-4 pb-8`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recipeQuery.isFetching && !recipeQuery.isLoading}
            onRefresh={() => recipeQuery.refetch()}
            tintColor={tw.color("primary")}
            colors={[tw.color("primary") as string]}
          />
        }
      >
        <DetailHeader title={t("productRecipe.title")} subtitle={title} />

        {variants.length > 1 && (
          <ThemedView style={tw`flex-row flex-wrap gap-2`}>
            <Chip
              label={t("productRecipe.allVariants")}
              selected={selectedVariant === null}
              onPress={() => setSelectedVariant(null)}
            />
            {variants.map((variant) => (
              <Chip
                key={variant.id}
                label={variant.name}
                selected={selectedVariant === variant.id}
                onPress={() => setSelectedVariant(variant.id)}
              />
            ))}
          </ThemedView>
        )}

        {available.length > 0 && (
          <ThemedText type="small" style={tw`text-gray-500 font-semibold`}>
            {t("productRecipe.enoughFor", {
              list: available
                .map((entry) =>
                  available.length > 1
                    ? `${entry.name} ${entry.count}`
                    : String(entry.count),
                )
                .join(" · "),
            })}
          </ThemedText>
        )}

        {recipeQuery.isLoading && (
          <ThemedText type="body1" style={tw`text-gray-500 text-center py-8`}>
            {t("loading")}
          </ThemedText>
        )}

        {recipeQuery.isError && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
            <ThemedText type="body1" style={tw`text-red-500`}>
              {t("loadError")}
            </ThemedText>
            <Button
              label={t("retry")}
              onPress={() => recipeQuery.refetch()}
              variant="outline"
            />
          </ThemedView>
        )}

        {recipe && visibleLines.length === 0 && (
          <ThemedView style={tw`items-center py-8 gap-3`}>
            <Icon name="chef-hat" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("productRecipe.empty")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center text-gray-500 px-4`}>
              {t("productRecipe.emptyDescription")}
            </ThemedText>
          </ThemedView>
        )}

        {visibleLines.length > 0 && (
          <DetailCard style={tw.style("py-2", canEdit && "pr-2")}>
            <NestedReorderableList
              data={visibleLines}
              keyExtractor={(line) => line.inventoryItemId}
              scrollEnabled={false}
              onReorder={({ from, to }) => {
                // Moves within what's shown map back to the full list.
                const fromIndex = draft.indexOf(visibleLines[from]);
                const toIndex = draft.indexOf(visibleLines[to]);
                setLines((current) =>
                  reorderItems(current ?? [], fromIndex, toIndex),
                );
              }}
              renderItem={({ item: line, index }) => (
                <IngredientRow
                  line={line}
                  amounts={amountsOf(line)}
                  isFirst={index === 0}
                  isLast={index === visibleLines.length - 1}
                  canEdit={canEdit}
                  onPress={() => sheetRef.current?.present(line)}
                  onMove={(delta) => move(draft.indexOf(line), delta)}
                />
              )}
            />
          </DetailCard>
        )}

        {canEdit && recipe && (
          <Button
            label={t("productRecipe.addIngredient")}
            leftIcon="plus"
            variant="outline"
            onPress={() => sheetRef.current?.present()}
          />
        )}
      </ScrollViewContainer>

      {canEdit && dirty && (
        <Button
          label={t("save")}
          onPress={handleSave}
          loading={saveRecipe.isPending}
          disabled={saveRecipe.isPending}
        />
      )}

      <RecipeIngredientSheet
        ref={sheetRef}
        variants={variants.map(({ id, name }) => ({ id, name }))}
        items={items}
        usedItemIds={draft.map((line) => line.inventoryItemId)}
        canSetRemovals={canSetRemovals}
        onSubmit={handleSubmit}
        onRemove={handleRemove}
        onCreateItem={(input) => createItem.mutateAsync(input)}
      />

      <DialogModal
        visible={leaving}
        title={t("productRecipe.discardTitle")}
        message={t("productRecipe.discardMessage")}
        confirmLabel={t("productRecipe.discard")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          setLeaving(false);
          router.back();
        }}
        onCancel={() => setLeaving(false)}
      />
    </ScreenLayout>
  );
}
