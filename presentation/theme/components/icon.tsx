import { type ComponentProps } from "react";
import Lucide, {
  type LucideIconName,
} from "@react-native-vector-icons/lucide/static";

import { usePalette } from "@/presentation/theme/store/useThemeStore";

export type IconName = LucideIconName;

type IconProps = ComponentProps<typeof Lucide>;

/**
 * Lucide icon. Without a color it uses the theme's icon color (never the
 * font's default black).
 */
export default function Icon({ color, ...props }: IconProps) {
  const palette = usePalette();
  return <Lucide color={color ?? palette.icon} {...props} />;
}
