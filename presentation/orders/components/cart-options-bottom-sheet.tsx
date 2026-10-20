import { forwardRef, useImperativeHandle, useRef } from "react";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";
import { useNewOrderStore } from "../store/newOrderStore";
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "./table-selector-bottom-sheet";
import ChangeItemsTypeBottomSheet, {
  itemsToChangeType,
  type ChangeItemsTypeBottomSheetRef,
} from "./change-items-type-bottom-sheet";

export type CartOptionsBottomSheetRef = {
  present: () => void;
};

type PendingTypeChange = { type: OrderType; table: Table | null };

/**
 * Options for the order being built in the cart: change its type and its
 * table. Switching to in place asks for a table first, and then (as when
 * switching to take away) which cart items also change type. Nothing changes
 * until the last step is confirmed.
 */
const CartOptionsBottomSheet = forwardRef<CartOptionsBottomSheetRef>(
  (_, ref) => {
    const { t } = useTranslation(["common", "orders"]);
    const orderType = useNewOrderStore((state) => state.orderType);
    const table = useNewOrderStore((state) => state.table);

    const optionsSheetRef = useRef<BottomSheetMethods>(null);
    const tableSelectorRef = useRef<TableSelectorBottomSheetRef>(null);
    const changeItemsTypeSheetRef = useRef<ChangeItemsTypeBottomSheetRef>(null);
    // Whether the table picker is choosing the table for a type change.
    const pickingTableForTypeRef = useRef(false);
    const pendingTypeChangeRef = useRef<PendingTypeChange | null>(null);

    useImperativeHandle(ref, () => ({
      present: () => optionsSheetRef.current?.present(),
    }));

    const applyTypeChange = (change: PendingTypeChange, itemIds: string[]) => {
      const { details, setDetails, setOrderType, setTable } =
        useNewOrderStore.getState();
      const ids = new Set(itemIds);
      setDetails(
        details.map((detail) =>
          detail.id && ids.has(detail.id)
            ? { ...detail, typeOrderDetail: change.type }
            : detail,
        ),
      );
      setOrderType(change.type);
      setTable(change.table);
    };

    const startTypeChange = (change: PendingTypeChange) => {
      const { details, orderType: currentType } = useNewOrderStore.getState();
      const items = itemsToChangeType(details, change.type, currentType);
      if (items.length === 0) {
        applyTypeChange(change, []);
        return;
      }
      pendingTypeChangeRef.current = change;
      changeItemsTypeSheetRef.current?.present(items, change.type);
    };

    const handleConfirmItemsType = (itemIds: string[]) => {
      const change = pendingTypeChangeRef.current;
      pendingTypeChangeRef.current = null;
      if (change) applyTypeChange(change, itemIds);
    };

    const handleChangeType = () => {
      optionsSheetRef.current?.dismiss();
      if (orderType === OrderType.TAKE_AWAY) {
        // An in-place order needs a table: pick it first.
        pickingTableForTypeRef.current = true;
        tableSelectorRef.current?.present();
        return;
      }
      startTypeChange({ type: OrderType.TAKE_AWAY, table: null });
    };

    const handleChangeTable = () => {
      optionsSheetRef.current?.dismiss();
      pickingTableForTypeRef.current = false;
      tableSelectorRef.current?.present();
    };

    const handleSelectTable = (selected: Table) => {
      if (pickingTableForTypeRef.current) {
        pickingTableForTypeRef.current = false;
        startTypeChange({ type: OrderType.IN_PLACE, table: selected });
        return;
      }
      useNewOrderStore.getState().setTable(selected);
    };

    const otherType =
      orderType === OrderType.IN_PLACE
        ? OrderType.TAKE_AWAY
        : OrderType.IN_PLACE;

    const items: ActionsBottomSheetItem[] = [
      {
        icon: "arrow-left-right",
        label: t("orders:options.changeType", {
          type: t(
            otherType === OrderType.IN_PLACE
              ? "common:orderType.inPlace"
              : "common:orderType.takeAway",
          ),
        }),
        onPress: handleChangeType,
      },
      ...(orderType === OrderType.IN_PLACE
        ? [
            {
              icon: "layout-grid" as const,
              label: t("orders:options.changeTable"),
              onPress: handleChangeTable,
            },
          ]
        : []),
    ];

    return (
      <>
        <ThemedBottomSheetModal ref={optionsSheetRef} enablePanDownToClose>
          <ActionsBottomSheet items={items} />
        </ThemedBottomSheetModal>

        <TableSelectorBottomSheet
          ref={tableSelectorRef}
          selectedTableId={table?.id}
          onSelectTable={handleSelectTable}
        />

        <ChangeItemsTypeBottomSheet
          ref={changeItemsTypeSheetRef}
          onConfirm={handleConfirmItemsType}
        />
      </>
    );
  },
);

CartOptionsBottomSheet.displayName = "CartOptionsBottomSheet";

export default CartOptionsBottomSheet;
