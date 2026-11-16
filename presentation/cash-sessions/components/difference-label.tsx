import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";

/** Sobrante / faltante / cuadrada as a pastel label; "sin contar" when null. */
export default function DifferenceLabel({
  difference,
  size = "small",
}: {
  difference: number | null;
  size?: "small" | "medium";
}) {
  const { t } = useTranslation(["common"]);
  if (difference == null)
    return (
      <Label
        size={size}
        color="default"
        text={t("common:cashRegister.summary.notCounted")}
      />
    );
  if (Math.abs(difference) < 0.005)
    return (
      <Label
        size={size}
        color="success"
        text={t("common:cashRegister.summary.balanced")}
      />
    );
  return (
    <Label
      size={size}
      color={difference > 0 ? "info" : "error"}
      text={t(
        difference > 0
          ? "common:cashRegister.summary.over"
          : "common:cashRegister.summary.short",
        { amount: formatCurrency(Math.abs(difference)) },
      )}
    />
  );
}
