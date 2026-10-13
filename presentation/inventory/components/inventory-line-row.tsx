import { Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

interface InventoryLineRowProps {
  name?: string;
  quantity: string;
  onPress?: () => void;
}

// Same plain-row look as the variants list in the menu product detail.
export default function InventoryLineRow({
  name,
  quantity,
  onPress,
}: InventoryLineRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) =>
        tw.style(
          "flex-row items-center justify-between gap-4 py-3",
          pressed && "opacity-60",
        )
      }
    >
      <ThemedText
        type="body1"
        style={[tw`flex-1`, { fontFamily: typography.semibold }]}
        numberOfLines={1}
      >
        {name}
      </ThemedText>
      <ThemedText type="body1">{quantity}</ThemedText>
    </Pressable>
  );
}
