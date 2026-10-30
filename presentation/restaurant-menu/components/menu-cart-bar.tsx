import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { typography } from "@/constants/theme";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";
import { usePalette } from "@/presentation/theme/store/useThemeStore";
import { useCountPop } from "@/presentation/shared/hooks/useCountPop";

interface MenuCartBarProps {
  label: string;
  icon: IconName;
  /** Units added so far. */
  count: number;
  onPress: () => void;
}

/**
 * The menu's one way to the cart: a centered pill docked above the search
 * bar showing what it leads to and how many items are in it.
 */
export default function MenuCartBar({
  label,
  icon,
  count,
  onPress,
}: MenuCartBarProps) {
  const { t } = useTranslation(["menu"]);
  const palette = usePalette();
  const popStyle = useCountPop(count);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${t("menu:inCart", { count })}`}
      style={({ pressed }) => [
        tw`self-center flex-row items-center gap-2.5 rounded-full bg-primary py-3 pl-5 pr-3 shadow-sm`,
        pressed && tw`opacity-80`,
      ]}
    >
      <Icon name={icon} size={20} color={palette.onPrimary} />
      <ThemedText style={tw`text-on-primary`}>{label}</ThemedText>
      <Animated.View
        style={[
          tw`h-7 items-center justify-center rounded-full px-2`,
          { minWidth: 28, backgroundColor: palette.onPrimary },
          popStyle,
        ]}
      >
        <ThemedText
          type="body2"
          style={{ color: palette.primary, fontFamily: typography.bold }}
        >
          {count}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}
