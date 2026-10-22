import { useContext, useRef } from "react";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import PeopleBottomSheet, {
  type PeopleBottomSheetRef,
} from "@/presentation/orders/components/people-bottom-sheet";
import {
  selectDraftDetails,
  useNewOrderStore,
} from "@/presentation/orders/store/newOrderStore";
import { itemsToChangeType } from "@/presentation/orders/components/change-items-type-bottom-sheet";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTableStatus } from "@/presentation/tables/hooks/useTableStatus";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";

interface TableActionsBottomSheetProps {
  table: Table;
  onCreateOrder: () => void;
}

/**
 * Sheet shown when tapping a table that has no orders of the current waiter:
 * start a new order for it (or carry on with the draft it already has) or
 * flip its status between occupied and available.
 */
const TableActionsBottomSheet = ({
  table,
  onCreateOrder,
}: TableActionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "tables"]);
  const { online } = useContext(SocketContext);
  const { hasOpenOrders, isOccupied } = useTableStatus(table.id);
  const { setTableAvailability } = useTablesManagement();
  const peopleSheetRef = useRef<PeopleBottomSheetRef>(null);

  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const setTable = useNewOrderStore((state) => state.setTable);
  const setOrderType = useNewOrderStore((state) => state.setOrderType);
  const openDraft = useNewOrderStore((state) => state.openDraft);
  const draftDetails = useNewOrderStore(selectDraftDetails("order"));
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const hasDraft = draftDetails.length > 0;

  // Continuing a draft from this table moves it here, whichever table it was
  // for, and a take away one turns dine in, items included (what confirming
  // the cart's type change does with every item checked).
  const handleContinueOrder = () => {
    openDraft("order");
    const { details, orderType, setDetails } = useNewOrderStore.getState();
    if (orderType !== OrderType.IN_PLACE) {
      const changing = new Set(
        itemsToChangeType(details, OrderType.IN_PLACE, orderType).map(
          (item) => item.id,
        ),
      );
      setDetails(
        details.map((detail) =>
          detail.id && changing.has(detail.id)
            ? { ...detail, typeOrderDetail: OrderType.IN_PLACE }
            : detail,
        ),
      );
      setOrderType(OrderType.IN_PLACE);
    }
    setTable(table);
    onCreateOrder();
  };

  // Creating asks for the people first; the order starts once they're picked
  const handleCreateOrder = () => {
    peopleSheetRef.current?.present();
  };

  const handlePeopleDone = (count: number) => {
    setPeople(count);
    setTable(table);
    setOrderType(OrderType.IN_PLACE);
    setActiveOrder(null);
    openDraft("order");
    onCreateOrder();
  };

  // A table with open orders can't be made available: the reason is shown
  // under the button and pressing it is a no-op.
  const isStatusBlocked = isOccupied && hasOpenOrders;

  const handleChangeStatus = () => {
    if (!online) {
      toast.info(t("tables:details.status.offline"));
      return;
    }
    if (isStatusBlocked) return;
    setTableAvailability.mutate({ id: table.id, isAvailable: isOccupied });
  };

  const statusText = isOccupied
    ? t("common:status.occupied")
    : t("common:status.available");

  return (
    <BottomSheetView style={tw`px-8 pb-6`}>
      <ThemedView style={tw`gap-4`}>
        <ThemedView style={tw`flex-row items-center justify-between gap-3`}>
          <ThemedText type="h3" numberOfLines={1} style={tw`flex-1`}>
            {t("tables:details.table", { name: table.name })}
          </ThemedText>
          <Label text={statusText} color={isOccupied ? "error" : "success"} />
        </ThemedView>

        <ThemedView style={tw`gap-2 mt-4`}>
          <Button
            variant="outline"
            label={
              hasDraft
                ? t("orders:actions.resumeOrder")
                : t("orders:actions.createOrder")
            }
            onPress={hasDraft ? handleContinueOrder : handleCreateOrder}
          />
          <Button
            variant="text"
            label={
              isOccupied
                ? t("tables:details.status.markAvailable")
                : t("tables:details.status.markOccupied")
            }
            loading={setTableAvailability.isPending}
            onPress={handleChangeStatus}
          />
          {isStatusBlocked && (
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("tables:details.status.hasOrders")}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      <PeopleBottomSheet
        ref={peopleSheetRef}
        value={people}
        onDone={handlePeopleDone}
      />
    </BottomSheetView>
  );
};

export default TableActionsBottomSheet;
