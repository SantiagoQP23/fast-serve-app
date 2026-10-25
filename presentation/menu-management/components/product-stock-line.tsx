import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Label from "@/presentation/theme/components/label";
import Icon from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { ProductStockSummary } from "@/core/menu/models/product.model";

/**
 * One line under a product in the menu: its stock ("24 en stock"), what its
 * recipe covers ("Alcanza para 14"), or that it isn't tracked, with an
 * Agotado/Bajo label when it needs attention.
 */
export default function ProductStockLine({
  summary,
}: {
  summary?: ProductStockSummary;
}) {
  const { t } = useTranslation("inventory");
  if (!summary) return null;

  let text: string;
  let icon: "package" | "chef-hat" | null = null;
  if (summary.mode === "own") {
    const available = summary.available ?? 0;
    // Sales went on after it ran out: say so instead of "-7 en stock"
    text =
      available < 0
        ? t("variant.soldWithoutStock", { count: -available })
        : t("variant.inStock", { count: available });
    icon = "package";
  } else if (summary.mode === "recipe") {
    text = t("variant.coversShort", {
      count: Math.max(summary.available ?? 0, 0),
    });
    icon = "chef-hat";
  } else if (summary.mode === "none") {
    text = t("variant.notTracked");
  } else {
    text = t("variant.variantCount", { count: summary.variantCount });
    if (summary.ownStockTotal !== null)
      text += ` · ${t("variant.inStock", { count: summary.ownStockTotal })}`;
  }

  const label =
    summary.level === "out"
      ? t("variant.outOfStock")
      : summary.level === "low"
        ? t("status.low")
        : summary.outCount > 0
          ? t("variant.variantsOut", { count: summary.outCount })
          : summary.lowCount > 0
            ? t("variant.variantsLow", { count: summary.lowCount })
            : null;
  // Red only when it can't be sold at all; some variants out is a warning,
  // like the Stock bajo count it falls under
  const labelColor = summary.level === "out" ? "error" : "warning";

  return (
    <ThemedView
      style={tw`flex-row items-center gap-1.5 flex-wrap bg-transparent`}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color={tw.color("text-on-surface-variant")}
        />
      )}
      <ThemedText type="small" style={tw`text-gray-500`}>
        {text}
      </ThemedText>
      {label && <Label text={label} color={labelColor} size="small" />}
    </ThemedView>
  );
}
