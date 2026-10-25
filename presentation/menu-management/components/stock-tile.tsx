import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

interface StockTileProps {
  count: number;
  label: string;
  selected?: boolean;
  /** Without it the tile is only a figure. */
  onPress?: () => void;
}

/** A count over the menu (Agotados, Stock bajo); tapping filters by it. */
export default function StockTile({
  count,
  label,
  selected,
  onPress,
}: StockTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={({ pressed }) =>
        tw.style(
          "flex-1 rounded-md border px-3 py-2",
          selected
            ? "bg-secondary border-transparent"
            : "border-outline-variant",
          pressed && "opacity-70",
        )
      }
    >
      <ThemedText
        type="h3"
        style={[
          { fontFamily: typography.semibold },
          { fontVariant: ["tabular-nums"] },
        ]}
      >
        {count}
      </ThemedText>
      <ThemedText type="small" style={tw`text-gray-500`} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
