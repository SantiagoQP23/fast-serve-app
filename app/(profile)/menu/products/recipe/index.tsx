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
   * "150 g" for the card's variant; empty for an unlimited insumo without
   * an amount; null while the amount is missing.
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
  const params = useLocalSearchParams<{ productId: string }>();
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
  const {
    sync,
    setLines,
    addPending,
    applyPendingOrder,
    applyPendingCopy,
    markSaved,
    reset,
  } = useRecipeDraftStore.getState();

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
      // Back from "Copiar de otro producto": the copy is a draft to review.
      const copied = applyPendingCopy();
      if (copied)
        toast.success(
          t("productRecipe.copy.done", {
            count: copied.count,
            name: copied.sourceName,
          }),
        );
      const added = addPending();
      if (!added.length) return;
      const timer = setTimeout(() => sheetRef.current?.present(added), 350);
      return () => clearTimeout(timer);
    }, [addPending, applyPendingOrder, applyPendingCopy, t]),
  );

  // Inactive variants keep their recipe but only get a card while they use
  // something.
  const variants = useMemo(
    () =>
      (recipe?.variants ?? []).filter(
        (variant) =>
          variant.isActive ||
          draft.some((line) => line.quantities[variant.id] !== undefined),
      ),
    [recipe, draft],
  );
  const multiVariant = variants.length > 1;
  const linesOf = (variantId: number) =>
    draft.filter((line) => line.quantities[variantId] !== undefined);

  /** The line's amount for one variant (see IngredientRow's `amounts`). */
  const amountFor = (line: RecipeIngredientDraft, variantId: number) => {
    const raw = line.quantities[variantId]?.trim() ?? "";
    // An unlimited insumo with no amount: its Label says enough.
    if (raw === "") return line.inventoryItem.isUnlimited ? "" : null;
    const amount = parseAmount(raw);
    return `${amount} ${t(`units.${line.inventoryItem.unit}`, { count: amount })}`;
  };

  /** How many servings the stock covers; null when it isn't counted. */
  const availableFor = (variantId: number) => {
    const option = product?.options?.find((item) => item.id === variantId);
    return option ? getProductOptionAvailableQuantity(option) : null;
  };

  const openPicker = () =>
    router.push({
      pathname: "/(profile)/menu/products/recipe/items",
      params: { productId },
    });

  const openCopy = () =>
    router.push({
      pathname: "/(profile)/menu/products/recipe/copy",
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
              <Button
                label={t("productRecipe.copy.button")}
                leftIcon="copy"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={openCopy}
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

        {!multiVariant &&
          variants[0] &&
          draft.length > 0 &&
          availableFor(variants[0].id) !== null && (
            <ThemedText
              type="small"
              style={[tw`text-gray-500`, { fontFamily: typography.medium }]}
            >
              {t("productRecipe.enoughFor", {
                list: String(availableFor(variants[0].id)),
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

        {recipe && draft.length === 0 && (
          <ThemedView style={tw`items-center py-10 gap-4`}>
            <Icon name="chef-hat" size={48} color={tw.color("gray-400")} />
            <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
              {t("productRecipe.empty")}
            </ThemedText>
            {canEdit && (
              <ThemedView style={tw`gap-2 bg-transparent`}>
                <Button
                  label={t("productRecipe.addItems")}
                  leftIcon="plus"
                  onPress={openPicker}
                />
                <Button
                  label={t("productRecipe.copy.button")}
                  leftIcon="copy"
                  variant="surface"
                  onPress={openCopy}
                />
              </ThemedView>
            )}
          </ThemedView>
        )}

        {/* One card per variant: each lists only what it uses. */}
        {draft.length > 0 &&
          (multiVariant ? variants : variants.slice(0, 1)).map((variant) => {
            const variantLines = multiVariant
              ? linesOf(variant.id)
              : draft;
            const count = availableFor(variant.id);
            return (
              <ThemedView key={variant.id} style={tw`gap-2 bg-transparent`}>
                <DetailSectionTitle
                  title={
                    multiVariant
                      ? variant.name
                      : t("productRecipe.sectionTitle")
                  }
                  action={
                    multiVariant ? (
                      !variant.isActive ? (
                        <Label text={t("status.inactive")} size="small" />
                      ) : count !== null ? (
                        <ThemedText
                          type="small"
                          style={[
                            tw`text-gray-500`,
                            { fontFamily: typography.medium },
                          ]}
                        >
                          {t("productRecipe.enoughFor", { list: count })}
                        </ThemedText>
                      ) : undefined
                    ) : undefined
                  }
                />
                <DetailCard style={tw`py-1`}>
                  {variantLines.length === 0 ? (
                    <ThemedText type="small" style={tw`text-gray-500 py-3`}>
                      {t("productRecipe.rowEmpty")}
                    </ThemedText>
                  ) : (
                    variantLines.map((line, index) => (
                      <IngredientRow
                        key={line.inventoryItemId}
                        line={line}
                        amounts={amountFor(line, variant.id)}
                        isLast={index === variantLines.length - 1}
                        canEdit={canEdit}
                        onPress={() => sheetRef.current?.present([line])}
                      />
                    ))
                  )}
                </DetailCard>
              </ThemedView>
            );
          })}
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
