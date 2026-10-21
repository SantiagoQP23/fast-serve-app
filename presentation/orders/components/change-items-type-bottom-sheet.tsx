import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Pressable } from "react-native";
import {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import type { Product } from "@/core/menu/models/product.model";
import type { ProductOption } from "@/core/menu/models/product-optionl.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Checkbox from "@/presentation/theme/components/checkbox";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";

export interface ChangeTypeItem {
  id: string;
  quantity: number;
  name: string;
  variant?: string;
  type: OrderType;
}

/** Item type of a cart line; lines added before it existed use the order's. */
type TypedLine = {
  id?: string;
  quantity: number;
  product: Product;
  productOption?: ProductOption | null;
  typeOrderDetail?: OrderType;
};

/**
 * The lines that would still have the old type after the order changes to
 * `newType`, as rows for the sheet. Pass only lines that can change
 * (e.g. not cancelled).
 */
export const itemsToChangeType = (
  lines: TypedLine[],
  newType: OrderType,
  currentOrderType: OrderType,
): ChangeTypeItem[] =>
  lines
    .map((line) => ({ line, type: line.typeOrderDetail ?? currentOrderType }))
    .filter(({ line, type }) => !!line.id && type !== newType)
    .map(({ line, type }) => ({
      id: line.id!,
      quantity: line.quantity,
      name: line.product.name,
      variant:
        (line.product.options?.length ?? 0) > 1
          ? line.productOption?.name
          : undefined,
      type,
    }));

export type ChangeItemsTypeBottomSheetRef = {
  /** Opens the sheet with every item checked. */
  present: (items: ChangeTypeItem[], newType: OrderType) => void;
  dismiss: () => void;
};

interface ChangeItemsTypeBottomSheetProps {
  /** Called with the checked item ids (may be empty) when the user confirms. */
  onConfirm: (itemIds: string[]) => void;
}

/**
 * Asked when the order type changes: which items also change to the new
 * type. Closing the sheet without confirming cancels the whole change.
 */
const ChangeItemsTypeBottomSheet = forwardRef<
  ChangeItemsTypeBottomSheetRef,
  ChangeItemsTypeBottomSheetProps
>(({ onConfirm }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [items, setItems] = useState<ChangeTypeItem[]>([]);
  const [newType, setNewType] = useState<OrderType>(OrderType.TAKE_AWAY);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    present: (nextItems, type) => {
      setItems(nextItems);
      setNewType(type);
      setSelected(new Set(nextItems.map((item) => item.id)));
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const typeLabel = (type: OrderType) =>
    t(
      type === OrderType.IN_PLACE
        ? "common:orderType.inPlace"
        : "common:orderType.takeAway",
    );

  const allSelected = items.length > 0 && selected.size === items.length;

  const toggle = (id: string, value: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (value: boolean) => {
    setSelected(value ? new Set(items.map((item) => item.id)) : new Set());
  };

  const handleConfirm = () => {
    onConfirm(items.filter((item) => selected.has(item.id)).map((i) => i.id));
    sheetRef.current?.dismiss();
  };

  return (
    // Sized to its content with the list capped below, so the list scrolls to
    // its end and the button stays visible (snap points hid both).
    <ThemedBottomSheetModal ref={sheetRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 gap-4`}>
        <ThemedView style={tw`gap-1 px-2`}>
          <ThemedText type="h3">
            {t("orders:changeItemsType.title", { type: typeLabel(newType) })}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("orders:changeItemsType.subtitle")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={tw`px-2`}>
          <Checkbox
            value={allSelected}
            onValueChange={toggleAll}
            label={t("orders:changeItemsType.all", { count: items.length })}
          />
        </ThemedView>

        <ThemedView style={tw`max-h-[50vh]`}>
          <BottomSheetScrollView
            contentContainerStyle={tw`gap-2`}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggle(item.id, !selected.has(item.id))}
                style={({ pressed }) => [
                  tw`p-4 rounded-2xl bg-surface-container-low flex-row items-center gap-3`,
                  pressed && tw`opacity-80`,
                ]}
              >
                <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                  <ThemedText type="body1" numberOfLines={2}>
                    {item.quantity} × {item.name}
                  </ThemedText>
                  {item.variant ? (
                    <ThemedText type="body2" style={tw`text-gray-600`}>
                      {item.variant}
                    </ThemedText>
                  ) : null}
                  <ThemedView style={tw`flex-row bg-transparent`}>
                    <Label
                      leftIcon={
                        item.type === OrderType.IN_PLACE
                          ? "utensils"
                          : "shopping-bag"
                      }
                      text={typeLabel(item.type)}
                    />
                  </ThemedView>
                </ThemedView>
                <Checkbox
                  value={selected.has(item.id)}
                  onValueChange={(value) => toggle(item.id, value)}
                />
              </Pressable>
            ))}
          </BottomSheetScrollView>
        </ThemedView>

        <Button
          label={t("orders:options.changeType", { type: typeLabel(newType) })}
          onPress={handleConfirm}
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

ChangeItemsTypeBottomSheet.displayName = "ChangeItemsTypeBottomSheet";

export default ChangeItemsTypeBottomSheet;
