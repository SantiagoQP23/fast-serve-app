import { formatQuantity } from "@/core/orders/utils/bill-split.util";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { typography } from "@/constants/theme";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Card from "@/presentation/theme/components/card";
import Button from "@/presentation/theme/components/button";
import IconButton from "@/presentation/theme/components/icon-button";
import Icon from "@/presentation/theme/components/icon";
import tw from "@/presentation/theme/lib/tailwind";

export interface SplitPersonLine {
  id: string;
  name: string;
  quantity: number;
  amount: number;
  /** Part of an item shared with others. */
  shared: boolean;
}

interface SplitPersonCardProps {
  name: string;
  total: number;
  lines: SplitPersonLine[];
  onEdit: () => void;
  onOptions: () => void;
}

/**
 * One person's future bill in the split: their name and total, what's on
 * it, and the way into editing it. Tapping the card edits it too.
 */
export default function SplitPersonCard({
  name,
  total,
  lines,
  onEdit,
  onOptions,
}: SplitPersonCardProps) {
  const { t } = useTranslation(["bills"]);

  return (
    <Card
      variant="outline"
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatCurrency(total)}`}
      accessibilityHint={t("bills:split.editBill")}
      style={tw`p-4 gap-3`}
    >
      <ThemedView style={tw`bg-transparent flex-row items-center gap-2`}>
        <ThemedText
          type="body1"
          numberOfLines={1}
          style={[tw`flex-1`, { fontFamily: typography.bold }]}
        >
          {name}
        </ThemedText>
        <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
          {formatCurrency(total)}
        </ThemedText>
        <IconButton
          icon="ellipsis-vertical"
          accessibilityLabel={t("bills:split.personOptions", { name })}
          onPress={onOptions}
          style={tw`-my-2 -mr-2`}
        />
      </ThemedView>

      {lines.length === 0 ? (
        <ThemedText type="body2" style={tw`text-gray-500`}>
          {t("bills:split.noItems")}
        </ThemedText>
      ) : (
        <ThemedView style={tw`bg-transparent gap-1.5`}>
          {lines.map((line) => (
            <ThemedView
              key={line.id}
              style={tw`bg-transparent flex-row items-center gap-2`}
            >
              <ThemedText
                type="body2"
                style={[tw`min-w-6`, { fontFamily: typography.bold }]}
              >
                {formatQuantity(line.quantity)}
              </ThemedText>
              <ThemedText type="body2" numberOfLines={1} style={tw`flex-1`}>
                {line.name}
              </ThemedText>
              {line.shared && (
                <Icon
                  name="split"
                  size={14}
                  accessibilityLabel={t("bills:split.sharedTag")}
                />
              )}
              <ThemedText type="body2" style={tw`text-gray-600`}>
                {formatCurrency(line.amount)}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      <Button
        label={t("bills:split.editBill")}
        leftIcon="pencil"
        variant="surface"
        size="small"
        style={tw`self-start`}
        onPress={onEdit}
      />
    </Card>
  );
}
