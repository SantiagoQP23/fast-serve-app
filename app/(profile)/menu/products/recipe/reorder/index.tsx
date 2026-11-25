import { useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
} from "react-native-reorderable-list";
import Icon from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useRecipeDraftStore } from "@/presentation/inventory/store/recipeDraftStore";
import { useProductRecipe } from "@/presentation/inventory/hooks/useProductRecipe";
import type { ProductRecipeLine } from "@/presentation/inventory/services/product-recipe.service";

function DraggableRow({ line }: { line: ProductRecipeLine }) {
  const drag = useReorderableDrag();

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={200}
      accessibilityRole="button"
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-4 px-4 py-4 mb-2 rounded-2xl",
          pressed && "opacity-80",
        )
      }
    >
      <ThemedText
        type="body1"
        numberOfLines={2}
        style={[tw`flex-1`, { fontFamily: typography.medium }]}
      >
        {line.inventoryItem.name}
      </ThemedText>
      <Icon
        name="grip-horizontal"
        size={24}
        color={tw.color("text-on-surface-variant")}
      />
    </Pressable>
  );
}

/**
 * Orders a recipe's ingredients (same shape as tables/reorder). Listo saves
 * the order right away. It orders the recipe as saved: insumos added on the
 * recipe screen but not saved yet stay at the end of its draft, which takes
 * the new order when it comes back into focus.
 */
export default function RecipeReorderScreen() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigation = useNavigation();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { recipe, saveRecipe } = useProductRecipe(productId);
  const queueOrder = useRecipeDraftStore((state) => state.queueOrder);
  const [initial] = useState(() => recipe?.lines ?? []);
  const [order, setOrder] = useState(initial);
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<any>(null);
  const done = useRef(false);

  const isDirty = order.some((line, i) => line !== initial[i]);
  const isSaving = saveRecipe.isPending;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || done.current || isSaving) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    });
    return unsubscribe;
  }, [navigation, isDirty, isSaving]);

  const handleDone = async () => {
    if (!isDirty) {
      router.back();
      return;
    }
    const saved = await saveRecipe
      .mutateAsync({
        lines: order.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          removable: line.removable,
          removalPriceDelta: Number(line.removalPriceDelta),
          quantities: line.quantities.map((entry) => ({
            productOptionId: entry.productOptionId,
            quantity: entry.quantity === null ? null : Number(entry.quantity),
          })),
        })),
      })
      .catch(() => null);
    // The hook already showed the error; the order stays on screen.
    if (!saved) return;
    // A recipe with unsaved edits keeps them, in the new order.
    queueOrder(order.map((line) => line.inventoryItemId));
    done.current = true;
    // No success toast: going back with the new order confirms it.
    router.back();
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`items-center gap-2 flex-row justify-between`}>
        <ThemedView style={tw`items-center gap-4 flex-row flex-1`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common:actions.goBack")}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
          </Pressable>
          <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
            {t("productRecipe.reorderTitle")}
          </ThemedText>
        </ThemedView>
        <Button
          label={t("common:actions.done")}
          size="small"
          onPress={handleDone}
          loading={isSaving}
          disabled={isSaving}
        />
      </ThemedView>

      <ReorderableList
        data={order}
        keyExtractor={(line) => line.inventoryItemId}
        renderItem={({ item }) => <DraggableRow line={item} />}
        onReorder={({ from, to }) =>
          setOrder((current) => reorderItems(current, from, to))
        }
        contentContainerStyle={tw`pb-8`}
        showsVerticalScrollIndicator={false}
      />

      <DialogModal
        visible={showDiscard}
        title={t("productRecipe.discardTitle")}
        message={t("productRecipe.reorderDiscardMessage")}
        confirmLabel={t("productRecipe.discard")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        onConfirm={() => {
          setShowDiscard(false);
          if (pendingAction.current) navigation.dispatch(pendingAction.current);
        }}
        onCancel={() => {
          pendingAction.current = null;
          setShowDiscard(false);
        }}
      />
    </ScreenLayout>
  );
}
