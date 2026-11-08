import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { OrderDetail } from "@/core/orders/models/order-detail.model";
import { formatQuantity } from "@/core/orders/utils/bill-split.util";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { typography } from "@/constants/theme";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Icon from "@/presentation/theme/components/icon";
import Card from "@/presentation/theme/components/card";
import tw from "@/presentation/theme/lib/tailwind";
import { useCountPop } from "@/presentation/shared/hooks/useCountPop";
import ModifierLines from "./modifier-lines";

interface SplitItemRowProps {
  detail: OrderDetail;
  /** Who the taps go to. */
  personName: string;
  /** Units the selected person has of this item on their own. */
  mine: number;
  unassigned: number;
  /** Units other people have on their own, e.g. "Luis ×1". */
  others: { name: string; quantity: number }[];
  share?: { quantity: number; names: string[] };
  /** Undefined when a tap has nothing to do, e.g. everything is assigned. */
  onPress?: () => void;
  onLongPress: () => void;
  onDecrease: () => void;
}

/** Ink count of what the selected person has; pops when it goes up. */
function MineCount({ count }: { count: number }) {
  const popStyle = useCountPop(count);
  return (
    <Animated.View
      style={[
        tw`min-w-9 h-9 px-2 rounded-full bg-primary items-center justify-center`,
        popStyle,
      ]}
    >
      <ThemedText
        type="body2"
        style={[tw`text-on-primary`, { fontFamily: typography.bold }]}
      >
        ×{formatQuantity(count)}
      </ThemedText>
    </Animated.View>
  );
}

/**
 * One order line in the split, as a card: tapping it gives one unit to the selected
 * person, long-press opens its options (share, remove). The status line says
 * what's left and who else has it.
 */
export default function SplitItemRow({
  detail,
  personName,
  mine,
  unassigned,
  others,
  share,
  onPress,
  onLongPress,
  onDecrease,
}: SplitItemRowProps) {
  const { t } = useTranslation(["common", "bills"]);
  const showOption = detail.product.options.length > 1 && detail.productOption;
  const name = showOption
    ? `${detail.product.name} ${detail.productOption?.name}`
    : detail.product.name;

  const status =
    unassigned > 0
      ? t("bills:split.unassigned", { quantity: formatQuantity(unassigned) })
      : t("bills:split.allAssigned");
  const othersText = others
    .map((other) => `${other.name} ×${formatQuantity(other.quantity)}`)
    .join(" · ");
  const shareText = share
    ? t("bills:split.sharedBetween", {
        quantity: formatQuantity(share.quantity),
        names: share.names.join(", "),
      })
    : null;

  return (
    <Card
      variant="outline"
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        formatCurrency(detail.price),
        mine > 0 ? `${personName} ×${formatQuantity(mine)}` : null,
        status,
        othersText,
        shareText,
      ]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={t("bills:split.rowHint", { name: personName })}
      // Theirs fills the card; nothing left for them to take fades it.
      style={tw.style("p-4", mine > 0 && "bg-secondary")}
      containerStyle={unassigned === 0 && mine === 0 && tw`opacity-50`}
    >
      <ThemedView style={tw`bg-transparent flex-row items-center gap-2`}>
        <ThemedView style={tw`flex-1 bg-transparent gap-0.5`}>
          <ThemedText
            type="body1"
            style={{ fontFamily: typography.medium }}
          >
            {name}
          </ThemedText>
          <ModifierLines modifiers={detail.modifiers} />
          <ThemedText type="body2" style={tw`text-gray-600`}>
            {formatCurrency(detail.price)}
            {" · "}
            <ThemedText
              type="body2"
              style={[
                tw`text-gray-600`,
                // Nothing left to give reads by weight, not by color.
                unassigned === 0 && { fontFamily: typography.bold },
              ]}
            >
              {status}
            </ThemedText>
          </ThemedText>
          {!!othersText && (
            <ThemedText type="small" style={tw`text-gray-500`}>
              {othersText}
            </ThemedText>
          )}
          {shareText && (
            <ThemedView
              style={tw`bg-transparent flex-row items-center gap-1.5 mt-0.5`}
            >
              <Icon name="split" size={14} />
              <ThemedText type="small" style={tw`text-gray-600 flex-1`}>
                {shareText}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {mine > 0 && (
          <ThemedView style={tw`bg-transparent flex-row items-center gap-2`}>
            <MineCount count={mine} />
            <Pressable
              onPress={onDecrease}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.decrease")}
              style={({ pressed }) => [
                tw`w-9 h-9 rounded-full bg-background items-center justify-center`,
                pressed && tw`opacity-60`,
              ]}
            >
              <Icon name="minus" size={18} />
            </Pressable>
          </ThemedView>
        )}
      </ThemedView>
    </Card>
  );
}
