import { useRef, useState } from "react";
import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { typography } from "@/constants/theme";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import {
  type CartType,
  selectDraftDetails,
  useNewOrderStore,
} from "@/presentation/orders/store/newOrderStore";

interface DraftOrderSectionProps {
  /** Which draft to show: the order (Pedidos) or the sale (Ventas). */
  cart: CartType;
}

/**
 * The unfinished order or sale on Home: an icon for its type, where it goes,
 * people and product count, with the total under the ⋯. Tapping it opens the cart; ⋯ adds products or clears it.
 */
export default function DraftOrderSection({ cart }: DraftOrderSectionProps) {
  const { t } = useTranslation(["orders", "common", "bills"]);
  const router = useRouter();
  const details = useNewOrderStore(selectDraftDetails(cart));
  const table = useNewOrderStore((state) => state.table);
  const orderType = useNewOrderStore((state) => state.orderType);
  const people = useNewOrderStore((state) => state.people);
  const openDraft = useNewOrderStore((state) => state.openDraft);
  const reset = useNewOrderStore((state) => state.reset);

  const optionsSheetRef = useRef<BottomSheetMethods>(null);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  if (details.length === 0) return null;

  const isOrder = cart === "order";

  // Same rule as the cart's subtitle: an order says where it goes
  const title = isOrder
    ? orderType === OrderType.TAKE_AWAY
      ? t("common:labels.takeAway")
      : table
        ? `${t("common:labels.table")} ${table.name}`
        : t("orders:newOrder.selectTable")
    : t("bills:list.newSale");

  const units = details.reduce((acc, detail) => acc + detail.quantity, 0);
  const total = details.reduce(
    (acc, detail) =>
      acc +
      (detail.price ?? detail.productOption?.price ?? 0) * detail.quantity,
    0,
  );

  // Same icons as the cart's In place / Take away toggle
  const typeIcon: IconName = !isOrder
    ? "receipt-text"
    : orderType === OrderType.TAKE_AWAY
      ? "shopping-bag"
      : "utensils";

  const peopleLabel =
    isOrder && people > 0 ? t("orders:draft.people", { count: people }) : null;

  const sectionTitle = t(
    isOrder ? "orders:draft.continueOrder" : "orders:draft.continueSale",
  );
  const unitsLabel = t("orders:draft.units", { count: units });
  const totalLabel = formatCurrency(total);

  const openCart = () => {
    openDraft(cart);
    router.push("/(new-order)/cart");
  };

  const openMenu = () => {
    optionsSheetRef.current?.dismiss();
    openDraft(cart);
    router.push("/(new-order)/restaurant-menu");
  };

  const handleClear = () => {
    setClearDialogVisible(false);
    reset(cart);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      // Hairline closes the section off from the tables/orders below
      style={tw`mt-2 mt-6  mb-8 gap-1 `}
    >
      <ThemedText
        type="body1"
        accessibilityRole="header"
        style={{ fontFamily: typography.semibold }}
      >
        {sectionTitle}
      </ThemedText>

      <Pressable
        onPress={openCart}
        accessibilityRole="button"
        accessibilityLabel={[title, peopleLabel, unitsLabel, totalLabel]
          .filter(Boolean)
          .join(", ")}
        style={({ pressed }) => [
          tw`flex-row items-start gap-3 pt-2`,
          pressed && tw`opacity-60`,
        ]}
      >
        <ThemedView
          style={tw`w-12 h-12 rounded-full bg-surface items-center justify-center`}
        >
          <Icon name={typeIcon} size={22} color={tw.color("on-surface")} />
        </ThemedView>

        <ThemedView style={tw`flex-1 gap-0.5`}>
          <ThemedText
            type="body1"
            numberOfLines={1}
            style={{ fontFamily: typography.medium }}
          >
            {title}
          </ThemedText>
          {peopleLabel && (
            <ThemedText type="body2" style={tw`text-on-surface-variant`}>
              {peopleLabel}
            </ThemedText>
          )}
          <ThemedText type="body2" style={tw`text-on-surface-variant`}>
            {unitsLabel}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`items-end`}>
          {/* Pulled out so the ⋯ glyph lines up with the total's right edge */}
          <IconButton
            icon="ellipsis-vertical"
            accessibilityLabel={t("common:actions.more")}
            onPress={() => optionsSheetRef.current?.present()}
            style={tw`-mr-3 -mt-3`}
          />
          <ThemedText type="body1" style={{ fontFamily: typography.bold }}>
            {totalLabel}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={title}
          items={[
            {
              icon: "plus",
              label: t("orders:draft.addProducts"),
              onPress: openMenu,
            },
            {
              icon: "trash",
              label: t("orders:draft.clear"),
              color: "text-red-500",
              onPress: () => {
                optionsSheetRef.current?.dismiss();
                setClearDialogVisible(true);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

      {/* Same confirmation as clearing from the cart's own options */}
      <DialogModal
        visible={clearDialogVisible}
        title={t("orders:dialogs.resetCartTitle")}
        message={t(
          isOrder
            ? "orders:dialogs.resetCartMessage"
            : "orders:draft.clearSaleMessage",
        )}
        confirmLabel={t("common:actions.clear")}
        confirmVariant="destructive"
        onConfirm={handleClear}
        onCancel={() => setClearDialogVisible(false)}
      />
    </Animated.View>
  );
}
