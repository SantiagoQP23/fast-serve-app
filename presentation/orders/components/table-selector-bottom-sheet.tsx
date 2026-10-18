import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  BottomSheetFlatList,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { Table } from "@/core/tables/models/table.model";
import { useTablesStore } from "@/presentation/tables/hooks/useTablesStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { typography } from "@/constants/theme";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import TablesGrid from "@/presentation/tables/components/tables-grid";

interface TableSelectorBottomSheetProps {
  selectedTableId?: string;
  onSelectTable: (table: Table) => void;
}

export type TableSelectorBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const TableSelectorBottomSheet = forwardRef<
  TableSelectorBottomSheetRef,
  TableSelectorBottomSheetProps
>(({ selectedTableId, onSelectTable }, ref) => {
  const { t } = useTranslation(["orders"]);
  const tables = useTablesStore((state) => state.tables);
  const sheetRef = useRef<BottomSheetMethods>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const activeTables = useMemo(
    () => tables.filter((table) => table.isActive !== false),
    [tables],
  );

  const handleTablePress = (table: Table) => {
    onSelectTable(table);
    sheetRef.current?.dismiss();
  };

  return (
    <ThemedBottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      snapPoints={["40%", "70%", "90%"]}
    >
      <BottomSheetView>
        <ThemedView style={tw`px-4 mb-4`}>
          <ThemedText
            type="h2"
            style={[tw`ml-3`, { fontFamily: typography.regular }]}
            numberOfLines={1}
          >
            {t("orders:newOrder.selectTable")}
          </ThemedText>
        </ThemedView>
        <ThemedView style={tw`max-h-[60vh]`}>
          <TablesGrid
            tables={activeTables}
            selectedTableId={selectedTableId}
            onTablePress={handleTablePress}
            ListComponent={BottomSheetFlatList}
            contentContainerStyle={tw`pb-10`}
          />
        </ThemedView>
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
});

TableSelectorBottomSheet.displayName = "TableSelectorBottomSheet";

export default TableSelectorBottomSheet;
