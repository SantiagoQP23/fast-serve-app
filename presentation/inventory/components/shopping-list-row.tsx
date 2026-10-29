import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  InventoryUnit,
  type InventoryItem,
} from "@/core/inventory/models/inventory-item.model";

// Stock is stored with 3 decimals; trims float noise like 1.4999999.
const formatQuantity = (quantity: number) => Number(quantity.toFixed(3));

interface ShoppingListRowProps {
  /** Its name; a variant's own stock carries the variant in it. */
  item: InventoryItem;
  /** How much to buy, or what's left for items without a minimum. */
  quantity: number;
  /** Bold for what to buy; muted for a quantity that's only informative. */
  muted?: boolean;
  /** Draws the divider to the next row. */
  divider?: boolean;
  /** Highlights the item open in the detail pane (tablet). */
  active?: boolean;
  onPress: () => void;
}

/**
 * One shopping list line: the quantity, then the name. Items counted in
 * units show the bare number ("12 Coca cola"); others keep their unit
 * ("2.5 kg Camarón").
 */
export default function ShoppingListRow({
  item,
  quantity,
  muted = false,
  divider = false,
  active = false,
  onPress,
}: ShoppingListRowProps) {
  const { t } = useTranslation("inventory");
  const amount = formatQuantity(quantity);
  const withUnit = t("quantityWithUnit", {
    quantity: amount,
    unit: t(`units.${item.unit}`, { count: amount }),
  });
  const shown = item.unit === InventoryUnit.UNIT ? String(amount) : withUnit;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${withUnit}, ${item.name}`}
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center gap-3 py-3",
          divider && "border-b border-divider",
          active && "-mx-2 px-2 rounded-lg bg-secondary",
          pressed && "opacity-70",
        )
      }
    >
      <ThemedText
        // Keeps short amounts in a column so the names line up
        style={[
          tw`min-w-8`,
          muted ? tw`text-gray-500` : { fontFamily: typography.bold },
        ]}
      >
        {shown}
      </ThemedText>
      <ThemedText style={tw`flex-1`} numberOfLines={1}>
        {item.name}
      </ThemedText>
    </Pressable>
  );
}
