import { useRef, useState, type RefObject } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { VariantStockMode } from "@/core/menu/models/product-optionl.model";

export interface OwnStockInput {
  quantity?: number;
  minimumQuantity?: number | null;
}

interface StockModeSheetProps {
  sheetRef: RefObject<BottomSheetMethods | null>;
  currentMode: VariantStockMode;
  /** Units the variant has now (own stock), to warn before dropping them. */
  ownStock?: number;
  recipeLineCount?: number;
  loading?: boolean;
  /** Resolves true when the change was saved. */
  onChoose: (
    mode: VariantStockMode,
    ownStock?: OwnStockInput,
  ) => Promise<boolean> | void;
}

const MODE_ICONS: Record<VariantStockMode, IconName> = {
  own: "hash",
  recipe: "chef-hat",
  none: "circle-off",
};

const MODES: VariantStockMode[] = ["own", "recipe", "none"];

const parseAmount = (value: string): number | undefined => {
  const parsed = Number(value.replace(",", "."));
  return value.trim() && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
};

/**
 * "¿Cómo se controla el stock?": own units, a recipe of insumos, or not at
 * all. Choosing own stock asks how many there are now and the minimum in a
 * sheet stacked on top.
 */
export default function StockModeSheet({
  sheetRef,
  currentMode,
  ownStock = 0,
  recipeLineCount = 0,
  loading,
  onChoose,
}: StockModeSheetProps) {
  const { t } = useTranslation("inventory");
  const [selected, setSelected] = useState<VariantStockMode>(currentMode);
  const [quantity, setQuantity] = useState("");
  const [minimum, setMinimum] = useState("");
  const ownSheetRef = useRef<BottomSheetMethods>(null);

  const reset = () => {
    setSelected(currentMode);
    setQuantity("");
    setMinimum("");
  };

  // What the change drops, said before it happens.
  const warning =
    selected === currentMode
      ? null
      : currentMode === "own"
        ? t("variant.mode.dropsOwnStock", { count: ownStock })
        : currentMode === "recipe" && selected !== "recipe"
          ? t("variant.mode.dropsRecipe", { count: recipeLineCount })
          : null;

  const handleContinue = () => {
    if (selected === "own" && currentMode !== "own") {
      ownSheetRef.current?.present();
      return;
    }
    onChoose(selected);
  };

  const handleSaveOwn = async () => {
    const saved = await onChoose("own", {
      quantity: parseAmount(quantity),
      minimumQuantity: parseAmount(minimum) ?? null,
    });
    if (saved) ownSheetRef.current?.dismiss();
  };

  return (
    <>
      <ThemedBottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        onDismiss={reset}
      >
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-3`}>
          <ThemedText type="h3">{t("variant.mode.title")}</ThemedText>

          {MODES.map((mode) => {
            const isSelected = selected === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setSelected(mode)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) =>
                  tw.style(
                    "flex-row gap-3 items-start rounded-md border p-3.5",
                    isSelected
                      ? "bg-secondary border-transparent"
                      : "border-outline-variant",
                    pressed && "opacity-70",
                  )
                }
              >
                <Icon
                  name={MODE_ICONS[mode]}
                  size={22}
                  color={tw.color("on-surface")}
                />
                <ThemedView style={tw`flex-1 gap-0.5 bg-transparent`}>
                  <ThemedText
                    type="body1"
                    style={{ fontFamily: typography.semibold }}
                  >
                    {t(`variant.mode.${mode}.label`)}
                    {mode === currentMode
                      ? ` · ${t("variant.mode.current")}`
                      : ""}
                  </ThemedText>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {t(`variant.mode.${mode}.description`)}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}

          {warning && (
            <ThemedText type="small" style={tw`text-orange-700`}>
              {warning}
            </ThemedText>
          )}

          <Button
            label={t("variant.mode.continue")}
            onPress={handleContinue}
            disabled={selected === currentMode || loading}
            loading={loading}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={ownSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <ThemedText type="h3">{t("variant.mode.own.label")}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("variant.mode.own.short")}
            </ThemedText>
          </ThemedView>
          <TextInput
            bottomSheet
            label={t("variant.mode.startQuantity")}
            placeholder="0"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <ThemedView style={tw`gap-1 bg-transparent`}>
            <TextInput
              bottomSheet
              label={t("variant.mode.minimum")}
              placeholder={t("variant.mode.optional")}
              value={minimum}
              onChangeText={setMinimum}
              keyboardType="decimal-pad"
            />
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("variant.minimumHint")}
            </ThemedText>
          </ThemedView>
          <Button
            label={t("save")}
            onPress={handleSaveOwn}
            disabled={loading}
            loading={loading}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </>
  );
}
