import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { ThemedView } from "../theme/components/themed-view";
import ButtonGroup from "../theme/components/button-group";
import Select from "../theme/components/select";
import tw from "../theme/lib/tailwind";
import { useNewOrderStore } from "./store/newOrderStore";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button, { ButtonProps } from "../theme/components/button";
import { ThemedText } from "../theme/components/themed-text";
import { useTables } from "../tables/hooks/useTables";
import { useOrdersStore } from "./store/useOrdersStore";
import { useRef } from "react";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useOrderTypes } from "./hooks/useOrderTypes";
import { typography } from "@/constants/theme";
import { Table } from "@/core/tables/models/table.model";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "../theme/components/bottom-sheet-picker";
import PeopleSelector from "./components/people-selector";
import PeopleBottomSheet, {
  type PeopleBottomSheetRef,
} from "./components/people-bottom-sheet";

interface NewOrderBottomSheetProps {
  onCreateOrder?: () => void;
  /**
   * Replaces opening the order draft once type, table and people are valid,
   * e.g. to turn the sale draft into the order.
   */
  onConfirm?: () => void;
  title?: string;
  buttonProps?: ButtonProps;
}

const NewOrderBottomSheet = ({
  onCreateOrder,
  onConfirm,
  title,
  buttonProps,
}: NewOrderBottomSheetProps) => {
  const { t } = useTranslation("orders");
  const orderTypes = useOrderTypes();
  const { orderType, setOrderType, table, setTable, people, setPeople } =
    useNewOrderStore();
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const openDraft = useNewOrderStore((state) => state.openDraft);
  const { tables } = useTables();
  const peopleSheetRef = useRef<PeopleBottomSheetRef>(null);
  const tablePickerRef = useRef<BottomSheetPickerRef>(null);
  // Table chosen in the picker a missing table opened; the order carries on
  // once that sheet has closed, so the next sheet doesn't open over it
  const pickedTableRef = useRef<Table | null>(null);

  const tableOptions = tables.map((table) => ({
    value: table.id,
    label: t("details.table") + " " + table.name,
  }));

  const validateNewOrder = (
    selectedTable: Table | null,
    peopleCount: number,
  ) => {
    // A missing table or people is asked for, not just warned about
    if (orderType === OrderType.IN_PLACE && !selectedTable) {
      tablePickerRef.current?.present();
      return false;
    }
    if (peopleCount <= 0) {
      peopleSheetRef.current?.present();
      return false;
    }
    setActiveOrder(null); // Reset active order

    return true;
  };

  // The store values aren't updated yet when a sheet hands over its pick, so
  // that pick comes in here
  const createOrder = ({
    table: selectedTable = table,
    people: peopleCount = people,
  }: { table?: Table | null; people?: number } = {}) => {
    const isValidOrder = validateNewOrder(selectedTable, peopleCount);
    if (!isValidOrder) return;

    if (onConfirm) {
      onConfirm();
      return;
    }
    openDraft("order");
    onCreateOrder && onCreateOrder();
  };

  const handleTablePicked = (id: string | number) => {
    const picked = tables.find((t) => t.id === id) || null;
    setTable(picked);
    pickedTableRef.current = picked;
  };

  // Picking the missing table or people carries on with the order
  const handleTablePickerDismiss = () => {
    const picked = pickedTableRef.current;
    pickedTableRef.current = null;
    if (picked) createOrder({ table: picked });
  };

  const handlePeopleDone = (count: number) => {
    setPeople(count);
    createOrder({ people: count });
  };

  return (
    <BottomSheetView style={tw`p-4 items-center justify-center `}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h2" style={tw`text-center inter-semibold`}>
          {title ?? t("newOrder.title")}
        </ThemedText>
        <ButtonGroup
          options={orderTypes}
          selected={orderType}
          onChange={(value: OrderType) => setOrderType(value)}
        />

        {orderType === OrderType.IN_PLACE && (
          <Select
            label={t("newOrder.selectTable")}
            options={tableOptions}
            value={table?.id}
            onChange={(value) =>
              setTable(tables.find((t) => t.id === value) || null)
            }
          />
        )}
        <ThemedView style={tw`gap-2`}>
          <ThemedText style={[tw` ml-2 `, { fontFamily: typography.medium }]}>
            {t("newOrder.people")}
          </ThemedText>
          <PeopleSelector value={people} onChange={setPeople} />
        </ThemedView>

        <ThemedView style={tw`w-full `}>
          <Button
            label={t("newOrder.selectProducts")}
            onPress={() => createOrder()}
            {...buttonProps}
          />
        </ThemedView>
      </ThemedView>
      <BottomSheetPicker
        ref={tablePickerRef}
        title={t("newOrder.selectTable")}
        options={tableOptions}
        value={table?.id}
        onChange={handleTablePicked}
        onDismiss={handleTablePickerDismiss}
      />
      <PeopleBottomSheet
        ref={peopleSheetRef}
        value={people}
        onDone={handlePeopleDone}
      />
    </BottomSheetView>
  );
};

export default NewOrderBottomSheet;
