import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
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
import TextInput from "@/presentation/theme/components/text-input";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { useMenuManagement } from "@/presentation/menu-management/hooks/useMenuManagement";
import type { Product } from "@/core/menu/models/product.model";
import {
  getVariantStockMode,
  type ProductOption,
} from "@/core/menu/models/product-optionl.model";
import {
  getLineItemId,
  getOwnStockLine,
} from "@/core/inventory/models/inventory-recipe.model";

/** Recipe lines listed in the sheet; the rest are counted. */
const MAX_RECIPE_LINES = 4;

const isDefaultOptionName = (name: string) =>
  name.trim().toLowerCase() === "normal";

export interface DuplicateVariantSheetRef {
  present: (product: Product, option: ProductOption) => void;
}

interface DuplicateVariantSheetProps {
  /** Called with the copy's id once saved, e.g. to open it. */
  onDuplicated?: (productOptionId: number) => void;
}

/**
 * Copies a variant into its product with its stock settings: a new own
 * stock at 0 (or the original's, shared), the same recipe, or nothing.
 * Name and price are edited here; the rest on the copy's own screen.
 */
const DuplicateVariantSheet = forwardRef<
  DuplicateVariantSheetRef,
  DuplicateVariantSheetProps
>(function DuplicateVariantSheet({ onDuplicated }, ref) {
  const { t } = useTranslation("menuManagement");
  const { duplicateProductOption } = useMenuManagement();
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [option, setOption] = useState<ProductOption | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [sharedStock, setSharedStock] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    present: (nextProduct, nextOption) => {
      setProduct(nextProduct);
      setOption(nextOption);
      setName(
        t("products.variants.duplicate.copyName", {
          name: nextOption.name,
        }),
      );
      setPrice(String(nextOption.price));
      setCurrentName("");
      setSharedStock(false);
      setQuantity("");
      setError("");
      sheetRef.current?.present();
    },
  }));

  const activeOptions = product?.options.filter((o) => o.isActive) ?? [];
  // Its second variant needs the first one to have a real name.
  const needsCurrentName =
    activeOptions.length === 1 &&
    (!product?.hasVariants || isDefaultOptionName(activeOptions[0].name));
  const mode = option ? getVariantStockMode(option) : "none";
  const ownLine = option ? getOwnStockLine(option.inventoryItems) : null;
  const recipeLines = mode === "recipe" ? (option?.inventoryItems ?? []) : [];

  const handleSave = () => {
    if (!product || !option) return;
    const trimmedName = name.trim();
    const parsedPrice = Number(price.replace(",", "."));
    const trimmedCurrentName = currentName.trim();

    if (!trimmedName) {
      setError(t("products.variants.validations.nameRequired"));
      return;
    }
    if (!price.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError(t("products.variants.validations.priceInvalid"));
      return;
    }
    if (needsCurrentName && !trimmedCurrentName) {
      setError(t("products.variants.validations.currentNameRequired"));
      return;
    }
    const takenNames = needsCurrentName
      ? [trimmedCurrentName]
      : activeOptions.map((o) => o.name);
    if (
      takenNames.some(
        (taken) => taken.trim().toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setError(t("products.variants.duplicate.nameTaken"));
      return;
    }
    const parsedQuantity = Number(quantity.replace(",", "."));
    if (
      quantity.trim() &&
      (!Number.isFinite(parsedQuantity) || parsedQuantity < 0)
    ) {
      setError(t("products.variants.duplicate.quantityInvalid"));
      return;
    }
    setError("");

    duplicateProductOption.mutate(
      {
        id: option.id,
        productId: product.id,
        name: trimmedName,
        price: parsedPrice,
        ...(needsCurrentName ? { currentOptionName: trimmedCurrentName } : {}),
        ...(ownLine && sharedStock ? { sharedStock: true } : {}),
        ...(ownLine && !sharedStock && parsedQuantity > 0
          ? { quantity: parsedQuantity }
          : {}),
      },
      {
        onSuccess: (copy) => {
          sheetRef.current?.dismiss();
          onDuplicated?.(copy.id);
        },
      },
    );
  };

  const choice = (shared: boolean, label: string, hint: string) => {
    const selected = sharedStock === shared;
    return (
      <Pressable
        onPress={() => setSharedStock(shared)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={({ pressed }) =>
          tw.style(
            "flex-row gap-3 items-start rounded-md border p-3",
            selected
              ? "bg-secondary border-transparent"
              : "border-outline-variant",
            pressed && "opacity-70",
          )
        }
      >
        <Icon
          name={shared ? "link" : "package-plus"}
          size={20}
          color={tw.color("on-surface")}
        />
        <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
          <ThemedText type="body2" style={{ fontFamily: typography.semibold }}>
            {label}
          </ThemedText>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {hint}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  };

  const ownItem = ownLine?.inventoryItem;
  const unit = (count: number, itemUnit?: string) =>
    itemUnit ? t(`inventory:units.${itemUnit}`, { count }) : "";

  return (
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedText type="h3">
          {t("products.variants.duplicate.title", { name: option?.name })}
        </ThemedText>

        {needsCurrentName && (
          <>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("products.variants.currentNameHint")}
            </ThemedText>
            <TextInput
              bottomSheet
              label={t("products.variants.currentName")}
              placeholder={t("products.variants.currentNamePlaceholder")}
              value={currentName}
              onChangeText={setCurrentName}
            />
            <ThemedText type="caption">
              {t("products.variants.duplicate.copy")}
            </ThemedText>
          </>
        )}

        <TextInput
          bottomSheet
          label={t("products.variants.fields.name")}
          placeholder={t("products.variants.placeholders.name")}
          value={name}
          onChangeText={setName}
          selectTextOnFocus
        />

        <TextInput
          bottomSheet
          label={t("products.variants.fields.price")}
          placeholder={t("products.variants.placeholders.price")}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        {mode === "own" && ownLine ? (
          <ThemedView style={tw`gap-2 bg-transparent`}>
            <ThemedText type="caption">
              {t("inventory:variant.mode.own.label")}
            </ThemedText>
            {choice(
              false,
              t("products.variants.duplicate.newStock"),
              ownItem?.minimumQuantity != null
                ? t("products.variants.duplicate.newStockHintMinimum", {
                    minimum: ownItem.minimumQuantity,
                  })
                : t("products.variants.duplicate.newStockHint"),
            )}
            {choice(
              true,
              t("products.variants.duplicate.sharedStock", {
                name: option?.name,
              }),
              t("products.variants.duplicate.sharedStockHint", {
                count: Math.max(ownItem?.quantity ?? 0, 0),
              }),
            )}
            {!sharedStock && (
              <TextInput
                bottomSheet
                label={t("products.variants.duplicate.quantity")}
                placeholder="0"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
            )}
          </ThemedView>
        ) : mode === "recipe" ? (
          <ThemedView
            style={tw`gap-2 rounded-md border border-outline-variant p-3 bg-transparent`}
          >
            <ThemedText
              type="body2"
              style={{ fontFamily: typography.semibold }}
            >
              {t("products.variants.duplicate.recipe")}
            </ThemedText>
            {recipeLines.slice(0, MAX_RECIPE_LINES).map((line) => (
              <ThemedView
                key={getLineItemId(line) ?? line.id}
                style={tw`flex-row gap-3 bg-transparent`}
              >
                <ThemedText type="body2" style={tw`flex-1`} numberOfLines={1}>
                  {line.inventoryItem?.name ??
                    t("inventory:detail.unknownProduct")}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("inventory:quantityWithUnit", {
                    quantity: line.quantity,
                    unit: unit(line.quantity, line.inventoryItem?.unit),
                  })}
                </ThemedText>
              </ThemedView>
            ))}
            {recipeLines.length > MAX_RECIPE_LINES && (
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("products.variants.duplicate.moreLines", {
                  count: recipeLines.length - MAX_RECIPE_LINES,
                })}
              </ThemedText>
            )}
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("products.variants.duplicate.recipeHint")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("products.variants.duplicate.noneHint")}
          </ThemedText>
        )}

        {error ? (
          <ThemedText type="small" style={tw`text-red-500`}>
            {error}
          </ThemedText>
        ) : null}

        <Button
          label={t("products.variants.duplicate.submit")}
          onPress={handleSave}
          loading={duplicateProductOption.isPending}
          disabled={duplicateProductOption.isPending}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

export default DuplicateVariantSheet;
