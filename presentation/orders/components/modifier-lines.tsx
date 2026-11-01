import {
  formatModifierLines,
  type OrderDetailModifier,
} from "@/core/menu/models/customization.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import tw from "@/presentation/theme/lib/tailwind";

/**
 * A line's customization under its name: "Sabor: Mora", "+ Extra camarón",
 * "Sin chifles". Renders nothing for lines without one.
 */
export default function ModifierLines({
  modifiers,
  numberOfLines,
}: {
  modifiers?: OrderDetailModifier[] | null;
  numberOfLines?: number;
}) {
  const { t } = useTranslation("menu");
  const lines = formatModifierLines(modifiers, {
    without: t("menu:customization.without"),
  });
  if (!lines.length) return null;
  return (
    <ThemedText
      type="body2"
      numberOfLines={numberOfLines}
      style={tw`text-gray-600`}
    >
      {lines.join("\n")}
    </ThemedText>
  );
}
