import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Text, Alert } from "react-native";
import { useState } from "react";
import { OrderType, orderTypes } from "@/core/orders/enums/order-type.enum";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Select from "@/presentation/theme/components/select";
import TextInput from "@/presentation/theme/components/text-input";
import Switch from "@/presentation/theme/components/switch";
import Button, { ButtonProps } from "@/presentation/theme/components/button";
import { useOrders } from "../hooks/useOrders";
import { UpdateOrderDto } from "@/core/orders/dto/update-order.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { i18nAlert } from "@/core/i18n/utils";
import { useOrderTypes } from "../hooks/useOrderTypes";

interface EditOrderBottomSheetProps {
  order: Order;
  buttonProps?: ButtonProps;
  onOrderUpdated?: () => void;
}

interface EditOrder {
  people: number;
  notes: string;
  orderType: OrderType;
  table: Table | null;
}

const EditOrderBottomSheet = ({
  order,
  buttonProps,
  onOrderUpdated,
}: EditOrderBottomSheetProps) => {
  const { t } = useTranslation(["orders", "tables", "common"]);
  const orderTypesOptions = useOrderTypes();
  
  const [form, setForm] = useState<EditOrder>({
    people: order.people,
    notes: order.notes || "",
    orderType: order.type,
    table: order.table || null,
  });

  const [withNotes, setWithNotes] = useState<boolean>(!!order.notes);

  const { tables } = useTables();
  const { mutate: updateOrder, isOnline, isLoading } = useOrders().updateOrder;

  const validateEditOrder = () => {
    if (form.orderType === OrderType.IN_PLACE && !form.table) {
      i18nAlert(t("validations:tableRequired"));
      return false;
    }
    return true;
  };

  const onUpdateOrder = () => {
    const isValid = validateEditOrder();
    if (!isValid) return;
    const updateOrderDto: UpdateOrderDto = {
      id: order.id,
      notes: form.notes,
      people: form.people,
      typeOrder: form.orderType,
      tableId:
        form.orderType === OrderType.IN_PLACE ? form.table?.id : undefined,
    };

    console.log("UpdateOrderDto to be sent:", updateOrderDto);

    try {
      updateOrder(updateOrderDto, {
        onSuccess: (resp) => {
          onOrderUpdated && onOrderUpdated();
        },
      });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <BottomSheetView style={tw`p-4 items-center justify-center`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h2" style={tw`text-center`}>
          {t("orders:edit.title")}
        </ThemedText>
        <ButtonGroup
          options={orderTypesOptions}
          selected={form.orderType}
          onChange={(value: OrderType) =>
            setForm({ ...form, orderType: value })
          }
        />

        {form.orderType === OrderType.IN_PLACE && (
          <Select
            label={t("tables:list.table")}
            placeholder={t("tables:list.selectTable")}
            options={tables.map((table) => ({
              value: table.id,
              label: t("tables:card.table") + " " + table.name,
            }))}
            value={form.table?.id}
            onChange={(value) =>
              setForm({
                ...form,
                table: tables.find((t) => t.id === value) || null,
              })
            }
          />
        )}
        <ThemedView style={tw`gap-2`}>
          <Text style={tw`text-gray-700 dark:text-gray-300  font-semibold`}>
            {t("orders:form.people")}
          </Text>
          <ThemedView style={tw`flex-row gap-2 items-center`}>
            <ThemedView style={tw`flex-1`}>
              <ButtonGroup
                options={[
                  { label: "1", value: 1 },
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "5", value: 5 },
                  { label: "6", value: 6 },
                ]}
                selected={form.people}
                onChange={(value: number) =>
                  setForm({ ...form, people: value })
                }
              />
            </ThemedView>
            <TextInput
              inputMode="numeric"
              multiline
              bottomSheet
              onChangeText={(value) => setForm({ ...form, people: +value })}
              value={form.people ? form.people.toString() : ""}
              style={tw`w-10`}
            />
          </ThemedView>
        </ThemedView>
        <ThemedView>
          <Switch
            label={t("orders:form.addNote")}
            value={withNotes}
            onValueChange={setWithNotes}
          />
          {withNotes && (
            <TextInput
              numberOfLines={5}
              multiline
              bottomSheet
              onChangeText={(value) => setForm({ ...form, notes: value })}
              value={form.notes}
            />
          )}
        </ThemedView>

        <ThemedView style={tw`w-full `}>
          <Button
            label={t("orders:actions.updateOrder")}
            onPress={() => onUpdateOrder()}
            {...buttonProps}
          />
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default EditOrderBottomSheet;
