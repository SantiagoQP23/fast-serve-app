import { useContext, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { toast } from "sonner-native";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import { PopoverMenu } from "@/presentation/theme/components/popover";
import PeopleSelector from "@/presentation/orders/components/people-selector";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useTableStatus } from "@/presentation/tables/hooks/useTableStatus";
import { useTablesManagement } from "@/presentation/tables/hooks/useTablesManagement";
import { SocketContext } from "@/presentation/shared/context/SocketContext";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";

// Wide enough for the "Disponible" pill plus the check mark on one line
const STATUS_POPOVER_WIDTH = 190;

interface TableActionsBottomSheetProps {
  table: Table;
  onCreateOrder: () => void;
}

/**
 * Sheet shown when tapping a table that has no orders of the current waiter:
 * start a new order for it (people, then the menu) or change its status from
 * the status label, which opens a popover.
 *
 * The popover is rendered inline instead of with the modal `Popover`: window
 * coordinates measured inside a native bottom sheet are relative to the sheet
 * content, so an anchored modal would open in the wrong place.
 */
const TableActionsBottomSheet = ({
  table,
  onCreateOrder,
}: TableActionsBottomSheetProps) => {
  const { t } = useTranslation(["common", "orders", "tables"]);
  const { online } = useContext(SocketContext);
  const { hasOpenOrders, isOccupied } = useTableStatus(table.id);
  const { setTableAvailability } = useTablesManagement();

  const [statusPopoverVisible, setStatusPopoverVisible] = useState(false);
  const [headerRowHeight, setHeaderRowHeight] = useState(0);

  const people = useNewOrderStore((state) => state.people);
  const setPeople = useNewOrderStore((state) => state.setPeople);
  const setTable = useNewOrderStore((state) => state.setTable);
  const setOrderType = useNewOrderStore((state) => state.setOrderType);
  const openDraft = useNewOrderStore((state) => state.openDraft);
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const handleCreateOrder = () => {
    if (people <= 0) {
      toast.error(t("orders:alerts.inputPeople"));
      return;
    }
    setTable(table);
    setOrderType(OrderType.IN_PLACE);
    setActiveOrder(null);
    openDraft("order");
    onCreateOrder();
  };

  // A table with open orders can't be made available: the reason is shown
  // under the header and picking "Available" is a no-op.
  const isStatusBlocked = isOccupied && hasOpenOrders;

  const handleToggleStatusPopover = () => {
    if (!online) {
      toast.info(t("tables:details.status.offline"));
      return;
    }
    setStatusPopoverVisible((visible) => !visible);
  };

  const handleChangeStatus = (isAvailable: boolean) => {
    if (isAvailable === !isOccupied) return;
    if (isAvailable && isStatusBlocked) return;
    setTableAvailability.mutate({ id: table.id, isAvailable });
  };

  const statusText = isOccupied
    ? t("common:status.occupied")
    : t("common:status.available");

  return (
    <BottomSheetView style={tw`px-8 pb-6`}>
      <ThemedView style={tw`gap-4`}>
        {/* Catches taps outside the popover; sits under the header so the
            label and the popover itself stay tappable. */}
        {statusPopoverVisible && (
          <Pressable
            accessible={false}
            style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
            onPress={() => setStatusPopoverVisible(false)}
          />
        )}

        <ThemedView style={[tw`gap-2`, { zIndex: 2 }]}>
          <ThemedView
            style={tw`flex-row items-center justify-between gap-3`}
            onLayout={(e) => setHeaderRowHeight(e.nativeEvent.layout.height)}
          >
            <ThemedText type="h3" numberOfLines={1} style={tw`flex-1`}>
              {t("tables:details.table", { name: table.name })}
            </ThemedText>
            <Label
              text={statusText}
              color={isOccupied ? "error" : "success"}
              rightIcon="chevron-down"
              hitSlop={10}
              disabled={setTableAvailability.isPending}
              onPress={handleToggleStatusPopover}
              accessibilityLabel={t("tables:details.status.change")}
            />
          </ThemedView>
          {isStatusBlocked && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("tables:details.status.hasOrders")}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={tw`gap-3`}>
          <ThemedText type="body2">{t("orders:newOrder.people")}</ThemedText>
          <PeopleSelector value={people} onChange={setPeople} />
        </ThemedView>

        <Button
          label={t("orders:newOrder.selectProducts")}
          onPress={handleCreateOrder}
        />

        {statusPopoverVisible && (
          <PopoverMenu
            onClose={() => setStatusPopoverVisible(false)}
            selectedValue={isOccupied ? "occupied" : "available"}
            style={{
              position: "absolute",
              top: headerRowHeight + 4,
              right: 0,
              width: STATUS_POPOVER_WIDTH,
              zIndex: 3,
            }}
            items={[
              {
                label: t("common:status.available"),
                value: "available",
                labelColor: "success",
                onPress: () => handleChangeStatus(true),
              },
              {
                label: t("common:status.occupied"),
                value: "occupied",
                labelColor: "error",
                onPress: () => handleChangeStatus(false),
              },
            ]}
          />
        )}
      </ThemedView>
    </BottomSheetView>
  );
};

export default TableActionsBottomSheet;
