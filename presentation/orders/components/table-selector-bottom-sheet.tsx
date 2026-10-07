import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Table } from "@/core/tables/models/table.model";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

interface TableSelectorBottomSheetProps {
  selectedTableId?: string;
  onSelectTable: (table: Table) => void;
}

export type TableSelectorBottomSheetRef = BottomSheetPickerRef;

const TableSelectorBottomSheet = forwardRef<
  TableSelectorBottomSheetRef,
  TableSelectorBottomSheetProps
>(({ selectedTableId, onSelectTable }, ref) => {
  const { t } = useTranslation(["common", "orders", "tables"]);
  const tables = useTablesStore((state) => state.tables);
  const pickerRef = useRef<BottomSheetPickerRef>(null);

  useImperativeHandle(ref, () => ({
    present: () => pickerRef.current?.present(),
    dismiss: () => pickerRef.current?.dismiss(),
  }));

  const options = useMemo(
    () =>
      tables.map((table) => ({
        label: t("tables:card.table", { name: table.name }),
        value: table.id,
      })),
    [tables, t],
  );

  const handleChange = (value: string | number) => {
    const table = tables.find((t) => t.id === value);
    if (table) onSelectTable(table);
  };

  return (
    <BottomSheetPicker
      ref={pickerRef}
      title={t("orders:newOrder.selectTable")}
      options={options}
      value={selectedTableId}
      onChange={handleChange}
    />
  );
});

TableSelectorBottomSheet.displayName = "TableSelectorBottomSheet";

export default TableSelectorBottomSheet;
