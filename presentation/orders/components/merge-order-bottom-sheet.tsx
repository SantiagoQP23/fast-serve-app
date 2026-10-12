import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Order } from "@/core/orders/models/order.model";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { formatCurrency } from "@/core/i18n/utils";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

interface MergeOrderBottomSheetProps {
  /** The order being merged; it is left out of the list. */
  order: Order;
  onSelectOrder: (target: Order) => void;
}

export type MergeOrderBottomSheetRef = BottomSheetPickerRef;

/**
 * Lists the other open orders to merge `order` into. Orders on the same
 * table come first, then the rest by number.
 */
const MergeOrderBottomSheet = forwardRef<
  MergeOrderBottomSheetRef,
  MergeOrderBottomSheetProps
>(({ order, onSelectOrder }, ref) => {
  const { t } = useTranslation(["common", "orders"]);
  const orders = useOrdersStore((state) => state.orders);
  const pickerRef = useRef<BottomSheetPickerRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => pickerRef.current?.present(),
    dismiss: () => pickerRef.current?.dismiss(),
  }));

  const candidates = useMemo(() => {
    const tableId = order.table?.id;
    return orders
      .filter((o) => o.id !== order.id && !o.isClosed)
      .sort((a, b) => {
        const aSameTable = !!tableId && a.table?.id === tableId ? 0 : 1;
        const bSameTable = !!tableId && b.table?.id === tableId ? 0 : 1;
        return aSameTable - bSameTable || a.num - b.num;
      });
  }, [orders, order.id, order.table?.id]);

  const options = useMemo(
    () =>
      candidates.map((o) => {
        const place =
          o.type === OrderType.IN_PLACE && o.table
            ? `${t("common:labels.table")} ${o.table.name}`
            : t("common:labels.takeAway");
        return {
          label: `#${o.num} · ${place} · ${formatCurrency(o.total)}`,
          value: o.id,
        };
      }),
    [candidates, t],
  );

  const handleChange = (value: string | number) => {
    const target = candidates.find((o) => o.id === value);
    if (target) onSelectOrder(target);
  };

  return (
    <BottomSheetPicker
      ref={pickerRef}
      title={t("orders:merge.title")}
      options={options}
      onChange={handleChange}
      searchable
      searchPlaceholder={t("orders:merge.search")}
    />
  );
});

MergeOrderBottomSheet.displayName = "MergeOrderBottomSheet";

export default MergeOrderBottomSheet;
