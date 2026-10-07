import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { Text, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import { useTables } from "@/presentation/tables/hooks/useTables";
import { Order } from "@/core/orders/models/order.model";
import { Table } from "@/core/tables/models/table.model";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Select from "@/presentation/theme/components/select";
import Button, { ButtonProps } from "@/presentation/theme/components/button";
import { useOrders } from "../hooks/useOrders";
import { UpdateOrderDto } from "@/core/orders/dto/update-order.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatTime, i18nAlert } from "@/core/i18n/utils";
import { useOrderTypes } from "../hooks/useOrderTypes";
import Card from "@/presentation/theme/components/card";
import PeopleSelector from "./people-selector";

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
  deliveryTime: Date;
}

const EditOrderBottomSheet = ({
  order,
  buttonProps,
  onOrderUpdated,
}: EditOrderBottomSheetProps) => {
  const { t } = useTranslation(["orders", "tables", "common"]);
  const orderTypesOptions = useOrderTypes();

  const initialDeliveryTime = useMemo(() => {
    const base = order.deliveryTime ? dayjs(order.deliveryTime) : dayjs();
    return base.second(0).millisecond(0).toDate();
  }, [order.deliveryTime]);

  const [form, setForm] = useState<EditOrder>({
    people: order.people,
    notes: order.notes || "",
    orderType: order.type,
    table: order.table || null,
    deliveryTime: initialDeliveryTime,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);

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
      deliveryTime: form.deliveryTime,
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

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      setForm((current) => {
        const nextTime = dayjs(selectedDate);
        const merged = dayjs(current.deliveryTime)
          .hour(nextTime.hour())
          .minute(nextTime.minute())
          .second(0)
          .millisecond(0);

        return { ...current, deliveryTime: merged.toDate() };
      });
    }
  };

  const openTimePicker = () => setShowTimePicker(true);
  const closeTimePicker = () => setShowTimePicker(false);

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
              label: t("tables:card.table", { name: table.name }),
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
          <PeopleSelector
            value={form.people}
            onChange={(value) => setForm({ ...form, people: value })}
          />
        </ThemedView>

        {/* <ThemedView style={tw`gap-2`}> */}
        {/* <Card onPress={openTimePicker}> */}
        {/*   <ThemedText */}
        {/*     type="body2" */}
        {/*     style={tw`text-gray-700 dark:text-gray-300 `} */}
        {/*   > */}
        {/*     {t("orders:form.deliveryTime")} */}
        {/*   </ThemedText> */}
        {/*   <ThemedText type="h2">{formatTime(form.deliveryTime)}</ThemedText> */}
        {/* </Card> */}
        {/* {Platform.OS === "ios" && showTimePicker && ( */}
        {/*   <ThemedView */}
        {/*     style={tw`border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden`} */}
        {/*   > */}
        {/*     <DateTimePicker */}
        {/*       value={form.deliveryTime} */}
        {/*       mode="time" */}
        {/*       display="spinner" */}
        {/*       onChange={handleTimeChange} */}
        {/*     /> */}
        {/*     <Button */}
        {/*       label={t("common:actions.confirm")} */}
        {/*       onPress={closeTimePicker} */}
        {/*       variant="primary" */}
        {/*       size="small" */}
        {/*     /> */}
        {/*   </ThemedView> */}
        {/* )} */}
        {/* {Platform.OS === "android" && showTimePicker && ( */}
        {/*   <DateTimePicker */}
        {/*     value={form.deliveryTime} */}
        {/*     mode="time" */}
        {/*     is24Hour={true} */}
        {/*     display="default" */}
        {/*     onChange={handleTimeChange} */}
        {/*   /> */}
        {/* )} */}
        {/* </ThemedView> */}

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
