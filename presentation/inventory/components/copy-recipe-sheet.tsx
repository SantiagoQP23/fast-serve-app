import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import {
  BottomSheetScrollView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Checkbox from "@/presentation/theme/components/checkbox";
import Chip from "@/presentation/theme/components/chip";
import SegmentedControl from "@/presentation/theme/components/segmented-control";
import {
  ProductRecipeService,
  type ProductRecipe,
} from "@/presentation/inventory/services/product-recipe.service";
import { productRecipeQueryKey } from "@/presentation/inventory/hooks/useProductRecipe";
import {
  copyRecipeLines,
  type PendingRecipeCopy,
  type RecipeCopyMode,
  type RecipeIngredientDraft,
} from "@/presentation/inventory/store/recipeDraftStore";

export interface CopyTargetVariant {
  id: number;
  name: string;
}

export type CopyRecipeSheetRef = {
  present: (source: { id: string; name: string }) => void;
  dismiss: () => void;
};

interface CopyRecipeSheetProps {
  /** Active variants of the product being edited. */
  variants: CopyTargetVariant[];
  /** The recipe being edited, unsaved changes included. */
  current: RecipeIngredientDraft[];
  canSetRemovals: boolean;
  onCopy: (copy: PendingRecipeCopy) => void;
}

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Which source variant each variant of this product copies from: the only
 * one, else the one with the same name, else the one in the same position,
 * else the first (plans/copiar-receta.md decision 7).
 */
export function defaultVariantMap(
  targets: CopyTargetVariant[],
  sources: { id: number; name: string }[],
): Record<number, number | null> {
  return Object.fromEntries(
    targets.map((target, position) => {
      if (!sources.length) return [target.id, null];
      if (sources.length === 1) return [target.id, sources[0].id];
      const byName = sources.find((source) =>
        sameName(source.name, target.name),
      );
      return [
        target.id,
        (byName ?? sources[position] ?? sources[0]).id,
      ];
    }),
  );
}

/**
 * Confirms a copy from another product's recipe: which ingredients, which
 * variant takes which amounts, and replace or add. Nothing is saved here; the
 * copy lands in the recipe draft.
 */
const CopyRecipeSheet = forwardRef<CopyRecipeSheetRef, CopyRecipeSheetProps>(
  ({ variants, current, canSetRemovals, onCopy }, ref) => {
    const { t } = useTranslation(["inventory", "common"]);
    const sheetRef = useRef<BottomSheetMethods>(null);
    const [source, setSource] = useState<{ id: string; name: string } | null>(
      null,
    );
    const [unchecked, setUnchecked] = useState<Set<string>>(() => new Set());
    const [variantMap, setVariantMap] = useState<Record<
      number,
      number | null
    > | null>(null);
    const [mode, setMode] = useState<RecipeCopyMode>("replace");

    const recipeQuery = useQuery({
      queryKey: productRecipeQueryKey(source?.id ?? ""),
      queryFn: () => ProductRecipeService.get(source!.id),
      enabled: !!source,
    });
    const recipe: ProductRecipe | undefined = recipeQuery.data;

    useImperativeHandle(ref, () => ({
      present: (next) => {
        setSource(next);
        setUnchecked(new Set());
        setVariantMap(null);
        setMode("replace");
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const inCurrent = useMemo(
      () => new Set(current.map((line) => line.inventoryItemId)),
      [current],
    );

    // Source variants worth copying from: the ones that use something.
    const sourceVariants = useMemo(
      () =>
        (recipe?.variants ?? []).filter((variant) =>
          recipe?.lines.some((line) =>
            line.quantities.some(
              (entry) => entry.productOptionId === variant.id,
            ),
          ),
        ),
      [recipe],
    );

    const map = useMemo(
      () => variantMap ?? defaultVariantMap(variants, sourceVariants),
      [variantMap, variants, sourceVariants],
    );

    // A paused insumo can't join a recipe that doesn't have it yet.
    const isBlocked = (itemId: string, isActive: boolean) =>
      !isActive && !inCurrent.has(itemId);

    const pickedIds = useMemo(
      () =>
        new Set(
          (recipe?.lines ?? [])
            .filter(
              (line) =>
                !unchecked.has(line.inventoryItemId) &&
                !isBlocked(line.inventoryItemId, line.inventoryItem.isActive),
            )
            .map((line) => line.inventoryItemId),
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [recipe, unchecked, inCurrent],
    );

    const effectiveMode: RecipeCopyMode = current.length ? mode : "replace";
    const result = useMemo(
      () =>
        recipe
          ? copyRecipeLines({
              source: recipe,
              itemIds: pickedIds,
              variantMap: map,
              mode: effectiveMode,
              canSetRemovals,
              current,
            })
          : null,
      [recipe, pickedIds, map, effectiveMode, canSetRemovals, current],
    );

    const alreadyThere =
      effectiveMode === "add"
        ? [...pickedIds].filter((id) => inCurrent.has(id)).length
        : 0;
    const sourceHasRemovals = !!recipe?.lines.some(
      (line) => line.removable && pickedIds.has(line.inventoryItemId),
    );

    const toggle = (itemId: string) =>
      setUnchecked((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });

    const setMapping = (targetId: number, sourceId: number | null) =>
      setVariantMap({ ...map, [targetId]: sourceId });

    const handleCopy = () => {
      if (!result || !source || !result.count) return;
      onCopy({
        sourceName: recipe?.productName ?? source.name,
        lines: result.lines,
        count: result.count,
      });
      sheetRef.current?.dismiss();
    };

    // Asked only when the two products don't line up on their own.
    const askVariants =
      sourceVariants.length > 1 && variants.length > 0;

    return (
      <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
        <BottomSheetScrollView contentContainerStyle={tw`px-4 pb-6 pt-2 gap-6`}>
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText
              type="h3"
              numberOfLines={2}
              style={{ fontFamily: typography.medium }}
            >
              {t("productRecipe.copy.sheetTitle", {
                name: recipe?.productName ?? source?.name ?? "",
              })}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("productRecipe.copy.sheetHint")}
            </ThemedText>
          </ThemedView>

          {recipeQuery.isLoading && (
            <ThemedText type="body1" style={tw`text-gray-500 text-center py-6`}>
              {t("loading")}
            </ThemedText>
          )}

          {recipeQuery.isError && (
            <ThemedView style={tw`items-center gap-3 py-4 bg-transparent`}>
              <ThemedText type="body1" style={tw`text-red-500`}>
                {t("loadError")}
              </ThemedText>
              <Button
                label={t("retry")}
                variant="outline"
                onPress={() => recipeQuery.refetch()}
              />
            </ThemedView>
          )}

          {recipe && (
            <>
              <ThemedView style={tw`bg-transparent`}>
                {recipe.lines.map((line) => {
                  const blocked = isBlocked(
                    line.inventoryItemId,
                    line.inventoryItem.isActive,
                  );
                  return (
                    <ThemedView
                      key={line.inventoryItemId}
                      style={tw`min-h-12 justify-center border-b border-divider bg-transparent`}
                    >
                      <Checkbox
                        label={line.inventoryItem.name}
                        labelType="body1"
                        value={pickedIds.has(line.inventoryItemId)}
                        disabled={blocked}
                        onValueChange={() => toggle(line.inventoryItemId)}
                        trailing={
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {blocked
                              ? t("productRecipe.copy.paused")
                              : effectiveMode === "add" &&
                                  inCurrent.has(line.inventoryItemId)
                                ? t("productRecipe.inRecipe")
                                : ""}
                          </ThemedText>
                        }
                      />
                    </ThemedView>
                  );
                })}
              </ThemedView>

              {askVariants && (
                <ThemedView style={tw`gap-3 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.bold }}
                  >
                    {variants.length === 1
                      ? t("productRecipe.copy.amountsFrom")
                      : t("productRecipe.copy.variantsTitle")}
                  </ThemedText>
                  {variants.map((target) => (
                    <ThemedView
                      key={target.id}
                      style={tw`gap-2 bg-transparent`}
                    >
                      {variants.length > 1 && (
                        <ThemedText type="body2" style={tw`text-gray-500`}>
                          {target.name}
                        </ThemedText>
                      )}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={tw`gap-2`}
                      >
                        {sourceVariants.map((sourceVariant) => (
                          <Chip
                            key={sourceVariant.id}
                            label={sourceVariant.name}
                            selected={map[target.id] === sourceVariant.id}
                            onPress={() =>
                              setMapping(target.id, sourceVariant.id)
                            }
                          />
                        ))}
                        {variants.length > 1 && (
                          <Chip
                            label={t("productRecipe.notUsed")}
                            selected={map[target.id] === null}
                            onPress={() => setMapping(target.id, null)}
                          />
                        )}
                      </ScrollView>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}

              {current.length > 0 && (
                <ThemedView style={tw`gap-2 bg-transparent`}>
                  <SegmentedControl
                    items={[
                      {
                        label: t("productRecipe.copy.replace"),
                        value: "replace",
                      },
                      { label: t("productRecipe.copy.add"), value: "add" },
                    ]}
                    value={mode}
                    onChange={setMode}
                  />
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {mode === "replace"
                      ? t("productRecipe.copy.replaceHint")
                      : alreadyThere > 0
                        ? t("productRecipe.copy.alreadyThere", {
                            count: alreadyThere,
                          })
                        : t("productRecipe.copy.addHint")}
                  </ThemedText>
                </ThemedView>
              )}

              {!canSetRemovals && sourceHasRemovals && (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("productRecipe.copy.removalsAdminOnly")}
                </ThemedText>
              )}

              <Button
                label={
                  result?.count
                    ? t("productRecipe.copy.submit", { count: result.count })
                    : t("productRecipe.copy.nothing")
                }
                disabled={!result?.count}
                onPress={handleCopy}
              />
            </>
          )}
        </BottomSheetScrollView>
      </ThemedBottomSheetModal>
    );
  },
);

CopyRecipeSheet.displayName = "CopyRecipeSheet";

export default CopyRecipeSheet;
