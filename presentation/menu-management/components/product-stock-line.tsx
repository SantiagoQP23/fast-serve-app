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
    text = t("variant.inStock", { count: summary.available ?? 0 });
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
  const labelColor =
    summary.level === "out" || summary.outCount > 0 ? "error" : "warning";

  return (
    <ThemedView
      style={tw`flex-row items-center gap-1.5 flex-wrap bg-transparent`}
    >
      {icon && (
        <Icon
          name={icon}
          size={13}
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
