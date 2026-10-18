import { type ComponentProps } from "react";
import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons/static";
import Lucide, {
  type LucideIconName,
} from "@react-native-vector-icons/lucide/static";
import lucideGlyphMap from "@react-native-vector-icons/lucide/glyphmaps/Lucide.json";

import { usePalette } from "@/presentation/theme/store/useThemeStore";

/**
 * Lucide name, or an Ionicons name for screens not migrated yet.
 * The Ionicons half goes away once every screen uses Lucide names.
 */
export type IconName = LucideIconName | IoniconsIconName;

export const isLucideIconName = (name: string): name is LucideIconName =>
  name in lucideGlyphMap;

type IconProps = Omit<ComponentProps<typeof Lucide>, "name"> & {
  name: IconName;
};

/**
 * Draws Lucide when the name exists there, otherwise Ionicons. Without a
 * color it uses the theme's icon color (never the font's default black).
 */
export default function Icon({ name, color, ...props }: IconProps) {
  const palette = usePalette();
  const iconColor = color ?? palette.icon;

  if (isLucideIconName(name)) {
    return <Lucide name={name} color={iconColor} {...props} />;
  }
  return <Ionicons name={name} color={iconColor} {...props} />;
}
