import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import {
  DetailCard,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import InventoryScreenHeader from "@/presentation/inventory/components/screen-header";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  canManageInventory,
  isAdminLevelRole,
} from "@/core/auth/models/user.model";
import { useProductRecipe } from "@/presentation/inventory/hooks/useProductRecipe";
import RecipeIngredientSheet, {
  type RecipeIngredientSheetRef,
} from "@/presentation/inventory/components/recipe-ingredient-sheet";
import {
  needsAmount,
  snapshot,
  useRecipeDraftStore,
  type RecipeIngredientDraft,
} from "@/presentation/inventory/store/recipeDraftStore";
import { parseAmount } from "@/presentation/menu-management/components/modifier-option-sheet";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { getProductOptionAvailableQuantity } from "@/core/menu/models/product-optionl.model";
import { getInventoryStockStatus } from "@/core/inventory/models/inventory-item.model";

/** One ingredient: tapped to edit. Ordering has its own screen. */
function IngredientRow({
  line,
  amounts,
  isLast,
  canEdit,
  onPress,
}: {
  line: RecipeIngredientDraft;
  /**
   * "150 g", "Chico 150 g · Grande 200 g"; empty for an unlimited insumo
   * without amounts; null while an amount is missing.
   */
  amounts: string | null;
  isLast: boolean;
  canEdit: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation("inventory");
  const discount = parseAmount(line.discount);
  const status = getInventoryStockStatus(line.inventoryItem);

  return (
    <Pressable
      onPress={canEdit ? onPress : undefined}
      disabled={!canEdit}
      accessibilityRole="button"
      accessibilityLabel={`${line.inventoryItem.name}, ${
        amounts ?? t("productRecipe.missingAmount")
      }`}
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
        {amounts === null ? (
          <ThemedText type="small" style={{ fontFamily: typography.bold }}>
            {t("productRecipe.missingAmount")}
          </ThemedText>
        ) : amounts ? (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {amounts}
          </ThemedText>
        ) : null}
        {(line.removable ||
          line.inventoryItem.isUnlimited ||
          status === "critical" ||
          status === "low") && (
          <ThemedView style={tw`flex-row flex-wrap gap-1.5 bg-transparent`}>
            {line.removable && (
              <Label
                size="small"
                color="default"
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
    </Pressable>
  );
}

/**
 * A product's recipe, every variant on one screen
 * (plans/unificar-receta-incluidos.md): what each variant uses, what the
 * customer can ask to leave out, and which insumos aren't counted. Insumos
 * are added from a tap-to-add picker; their amounts are asked right after.
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

  const storeProductId = useRecipeDraftStore((state) => state.productId);
  const lines = useRecipeDraftStore((state) => state.lines);
  const saved = useRecipeDraftStore((state) => state.saved);
  const { sync, setLines, addPending, applyPendingOrder, markSaved, reset } =
    useRecipeDraftStore.getState();

  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    params.variantId ? Number(params.variantId) : null,
  );
  const [leaving, setLeaving] = useState(false);
  const sheetRef = useRef<RecipeIngredientSheetRef>(null);

  // First load (and a reload with nothing pending) fills the draft.
  useEffect(() => {
    if (recipe) sync(productId, recipe);
  }, [recipe, productId, sync]);

  // The draft lives only while this screen does.
  useEffect(() => reset, [reset]);

  const draft = useMemo(
    () => (storeProductId === productId ? (lines ?? []) : []),
    [storeProductId, productId, lines],
  );
  const dirty =
    storeProductId === productId && lines !== null && snapshot(draft) !== saved;

  // Back from the reorder screen: take its order. Back from the picker: add
  // what was picked, then ask for each new insumo's amount, one after another.
  useFocusEffect(
    useCallback(() => {
      applyPendingOrder();
      const added = addPending();
      if (!added.length) return;
      const timer = setTimeout(() => sheetRef.current?.present(added), 350);
      return () => clearTimeout(timer);
    }, [addPending, applyPendingOrder]),
  );

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

  const amountOf = (line: RecipeIngredientDraft, raw: string | undefined) => {
    if (raw === undefined) return "—";
    if (raw === "") return t("productRecipe.noAmountShort");
    const amount = parseAmount(raw);
    return `${amount} ${t(`units.${line.inventoryItem.unit}`, { count: amount })}`;
  };
  /** Every shown variant's amount, named when they differ. */
  const amountsOf = (line: RecipeIngredientDraft) => {
    const raws = shownVariants.map((variant) => line.quantities[variant.id]);
    if (
      !line.inventoryItem.isUnlimited &&
      raws.some((raw) => raw !== undefined && raw.trim() === "")
    )
      return null;
    // An unlimited insumo with no amount anywhere: its Label says enough.
    if (raws.every((raw) => raw === undefined || raw === "")) return "";
    if (raws.length === 1) return amountOf(line, raws[0]);
    if (raws.every((raw) => raw === raws[0]) && raws[0] !== undefined)
      return t("productRecipe.sameAll", { amount: amountOf(line, raws[0]) });
    return shownVariants
      .map((variant, i) => `${variant.name} ${amountOf(line, raws[i])}`)
      .join(" · ");
  };

  const available = (product?.options ?? [])
    .filter((option) => shownVariants.some((v) => v.id === option.id))
    .map((option) => ({
      name: option.name,
      count: getProductOptionAvailableQuantity(option),
    }))
    .filter((entry) => entry.count !== null);

  const openPicker = () =>
    router.push({
      pathname: "/(profile)/menu/products/recipe/items",
      params: { productId },
    });

  const openReorder = () =>
    router.push({
      pathname: "/(profile)/menu/products/recipe/reorder",
      params: { productId },
    });

  const handleSubmit = (ingredient: RecipeIngredientDraft) =>
    setLines((current) =>
      current.map((line) =>
        line.inventoryItemId === ingredient.inventoryItemId ? ingredient : line,
      ),
    );

  const handleRemove = (ingredient: RecipeIngredientDraft) => {
    const index = draft.findIndex(
      (line) => line.inventoryItemId === ingredient.inventoryItemId,
    );
    if (index === -1) return;
    setLines((current) =>
      current.filter(
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
              const next = [...current];
              next.splice(Math.min(index, next.length), 0, ingredient);
              return next;
            });
          },
        },
      },
    );
  };

  const handleSave = async () => {
    // Amounts still missing: go through them instead of failing on save.
    const incomplete = draft.filter(needsAmount);
    if (incomplete.length) {
      sheetRef.current?.present(incomplete);
      return;
    }
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
    markSaved(recipeSaved);
    toast.success(t("productRecipe.saved"));
  };

  const goBack = () => (dirty ? setLeaving(true) : router.back());

  const productName = recipe?.productName ?? product?.name ?? "";
  const subtitle = recipe
    ? t("productRecipe.headerSubtitle", { count: draft.length })
    : t("productRecipe.title");

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-8 bg-background`}>
      <ThemedView style={tw`mb-6 bg-transparent`}>
        <InventoryScreenHeader onBack={goBack} />
      </ThemedView>

      <ScrollView
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
        <DetailHeader
          title={productName}
          subtitle={subtitle}
          icon="chef-hat"
        >
          {canEdit && draft.length > 0 && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              <Button
                label={t("productRecipe.addItems")}
                leftIcon="plus"
                shape="rounded"
                size="small"
                onPress={openPicker}
              />
              {/* Orders the saved recipe, so it needs two saved lines */}
              {(recipe?.lines.length ?? 0) > 1 && (
                <Button
                  label={t("productRecipe.reorder")}
                  leftIcon="arrow-up-down"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  onPress={openReorder}
                />
              )}
            </ThemedView>
          )}
        </DetailHeader>

        {variants.length > 1 && draft.length > 0 && (
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
          <ThemedText
            type="small"
            style={[tw`text-gray-500`, { fontFamily: typography.medium }]}
          >
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
          <ThemedView style={tw`items-center py-10 gap-4`}>
            <Icon name="chef-hat" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
              {t("productRecipe.empty")}
            </ThemedText>
            {canEdit && draft.length === 0 && (
              <Button
                label={t("productRecipe.addItems")}
                leftIcon="plus"
                onPress={openPicker}
              />
            )}
          </ThemedView>
        )}

        {visibleLines.length > 0 && (
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <DetailSectionTitle title={t("productRecipe.sectionTitle")} />
            <DetailCard style={tw`py-1`}>
              {visibleLines.map((line, index) => (
                <IngredientRow
                  key={line.inventoryItemId}
                  line={line}
                  amounts={amountsOf(line)}
                  isLast={index === visibleLines.length - 1}
                  canEdit={canEdit}
                  onPress={() => sheetRef.current?.present([line])}
                />
              ))}
            </DetailCard>
          </ThemedView>
        )}
      </ScrollView>

      {canEdit && dirty && (
        <ThemedView style={tw`pt-2 pb-2 bg-transparent`}>
          <Button
            label={t("save")}
            onPress={handleSave}
            loading={saveRecipe.isPending}
            disabled={saveRecipe.isPending}
          />
        </ThemedView>
      )}

      <RecipeIngredientSheet
        ref={sheetRef}
        variants={variants.map(({ id, name }) => ({ id, name }))}
        canSetRemovals={canSetRemovals}
        onSubmit={handleSubmit}
        onRemove={handleRemove}
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
