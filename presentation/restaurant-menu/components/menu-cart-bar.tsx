import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { usePalette } from "@/presentation/theme/store/useThemeStore";
import { useCountPop } from "@/presentation/shared/hooks/useCountPop";

interface MenuCartBarProps {
  label: string;
  icon: IconName;
  /** Units added so far. */
  count: number;
  total: number;
  onPress: () => void;
}

/**
 * The menu's one way to the cart, docked above the search bar: what it leads
 * to on the left, how many items and how much on the right.
 */
export default function MenuCartBar({
  label,
  icon,
  count,
  total,
  onPress,
}: MenuCartBarProps) {
  const { t } = useTranslation(["menu"]);
  const palette = usePalette();
  const popStyle = useCountPop(count);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${t("menu:inCart", { count })}, ${formatCurrency(total)}`}
      style={({ pressed }) => [
        tw`flex-row items-center gap-3 rounded-md bg-primary px-5 py-4 shadow-sm`,
        pressed && tw`opacity-80`,
      ]}
    >
      <Icon name={icon} size={20} color={palette.onPrimary} />
      <ThemedText style={tw`flex-1 text-on-primary`}>{label}</ThemedText>
      <Animated.View style={[tw`flex-row items-center gap-2`, popStyle]}>
        <ThemedText style={tw`text-on-primary font-bold`}>{count}</ThemedText>
        <ThemedText style={tw`text-on-primary opacity-70`}>·</ThemedText>
        <ThemedText style={tw`text-on-primary`}>
          {formatCurrency(total)}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}
