import { forwardRef, useImperativeHandle, useRef } from "react";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useNewOrderStore } from "../store/newOrderStore";
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "./table-selector-bottom-sheet";
import ChangeItemsTypeBottomSheet, {
  itemsToChangeType,
  type ChangeItemsTypeBottomSheetRef,
} from "./change-items-type-bottom-sheet";

export type CartTypeChangeSheetsRef = {
  /** Switch the cart's order to `type`, asking what the change needs. */
  changeType: (type: OrderType) => void;
  /** Pick another table for an in-place order. */
  changeTable: () => void;
};

type PendingTypeChange = { type: OrderType; table: Table | null };

/**
 * The sheets behind changing the cart order's type or table. Switching to in
 * place asks for a table first, and then (as when switching to take away)
 * which cart items also change type. Nothing changes until the last step is
 * confirmed.
 */
const CartTypeChangeSheets = forwardRef<CartTypeChangeSheetsRef>((_, ref) => {
  const table = useNewOrderStore((state) => state.table);

  const tableSelectorRef = useRef<TableSelectorBottomSheetRef>(null);
  const changeItemsTypeSheetRef = useRef<ChangeItemsTypeBottomSheetRef>(null);
  // Whether the table picker is choosing the table for a type change.
  const pickingTableForTypeRef = useRef(false);
  const pendingTypeChangeRef = useRef<PendingTypeChange | null>(null);

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

  useImperativeHandle(ref, () => ({
    changeType: (type) => {
      if (type === useNewOrderStore.getState().orderType) return;
      if (type === OrderType.IN_PLACE) {
        // An in-place order needs a table: pick it first.
        pickingTableForTypeRef.current = true;
        tableSelectorRef.current?.present();
        return;
      }
      startTypeChange({ type: OrderType.TAKE_AWAY, table: null });
    },
    changeTable: () => {
      pickingTableForTypeRef.current = false;
      tableSelectorRef.current?.present();
    },
  }));

  const handleSelectTable = (selected: Table) => {
    if (pickingTableForTypeRef.current) {
      pickingTableForTypeRef.current = false;
      startTypeChange({ type: OrderType.IN_PLACE, table: selected });
      return;
    }
    useNewOrderStore.getState().setTable(selected);
  };

  return (
    <>
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
});

CartTypeChangeSheets.displayName = "CartTypeChangeSheets";

export default CartTypeChangeSheets;
