import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";

import { useCallback, useRef } from "react";
import tw from "@/presentation/theme/lib/tailwind";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import NewOrderBottomSheet from "@/presentation/orders/new-order-bottom-sheet";
import { router } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import TablesView from "@/presentation/tables/components/tables-view";

export default function TablesScreen() {
  const { t } = useTranslation("tables");
  const { setTable, setOrderType } = useNewOrderStore();
  const orders = useOrdersStore((state) => state.orders);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handleNavigate = () => {
    bottomSheetModalRef.current?.close();
    router.push("/(new-order)/restaurant-menu");
  };

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const onTablePress = (table: Table) => {
    const tableHasOrders = orders.some(
      (order) => order.table?.id === table.id,
    );

    if (tableHasOrders) {
      router.push({
        pathname: "/(tables)/[tableId]",
        params: { tableId: table.id, tableName: table.name },
      });
    } else {
      setTable(table);
      setOrderType(OrderType.IN_PLACE);
      handlePresentModalPress();
    }
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1`}>
      <ThemedText type="h2">{t("list.title")}</ThemedText>
      <ThemedView style={tw`mt-4`} />
      <TablesView onTablePress={onTablePress} />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
      >
        <NewOrderBottomSheet onCreateOrder={handleNavigate} />
      </BottomSheetModal>
    </ScreenLayout>
  );
}
