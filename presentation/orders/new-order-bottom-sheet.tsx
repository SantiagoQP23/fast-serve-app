import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { View, Text, Alert } from "react-native";
import { ThemedView } from "../theme/components/themed-view";
import ButtonGroup from "../theme/components/button-group";
import Select from "../theme/components/select";
import tw from "../theme/lib/tailwind";
import { useState } from "react";
import { useNewOrderStore } from "./store/newOrderStore";
import { OrderType, orderTypes } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import Button, { ButtonProps } from "../theme/components/button";
import { ThemedText } from "../theme/components/themed-text";
import Switch from "../theme/components/switch";
import TextInput from "../theme/components/text-input";
import { useTables } from "../tables/hooks/useTables";

interface NewOrderBottomSheetProps {
  onCreateOrder?: () => void;
  buttonProps?: ButtonProps;
}

const NewOrderBottomSheet = ({
  onCreateOrder,
  buttonProps,
}: NewOrderBottomSheetProps) => {
  const {
    orderType,
    setOrderType,
    table,
    setTable,
    people,
    setPeople,
    setNotes,
    notes,
  } = useNewOrderStore();
  const [withNotes, setWithNotes] = useState<boolean>(!!notes);
  const { getTables } = useTables();

  const tables: Table[] = getTables();

  const validateNewOrder = () => {
    if (orderType === OrderType.IN_PLACE && !table) {
      Alert.alert("Please select a table");
      return false;
    }
    return true;
  };

  return (
    <BottomSheetView style={tw`p-4 items-center justify-center`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedText type="h2" style={tw`text-center`}>
          New Order{" "}
        </ThemedText>
        <ButtonGroup
          options={orderTypes}
          selected={orderType}
          onChange={(value: OrderType) => setOrderType(value)}
        />

        {orderType === OrderType.IN_PLACE && (
          <Select
            label="Table"
            placeholder="Select table"
            options={tables.map((table) => ({
              value: table.id,
              label: table.name,
            }))}
            value={table?.id}
            onChange={(value) =>
              setTable(tables.find((t) => t.id === value) || null)
            }
          />
        )}
        <ThemedView style={tw`gap-2`}>
          <Text style={tw`text-gray-700 dark:text-gray-300  font-semibold`}>
            People
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
                selected={people}
                onChange={(value: number) => setPeople(value)}
              />
            </ThemedView>
            <TextInput
              inputMode="numeric"
              multiline
              bottomSheet
              onChangeText={(value) => setPeople(+value)}
              value={people ? people.toString() : ""}
              style={tw`w-10`}
            />
          </ThemedView>
        </ThemedView>
        <ThemedView>
          <Switch
            label="Add note"
            value={withNotes}
            onValueChange={setWithNotes}
          />
          {withNotes && (
            <TextInput
              numberOfLines={5}
              multiline
              bottomSheet
              onChangeText={(value) => setNotes(value)}
              value={notes}
            />
          )}
        </ThemedView>

        <ThemedView style={tw`w-full `}>
          <Button
            label="Create order"
            onPress={() =>
              validateNewOrder() && onCreateOrder && onCreateOrder()
            }
            {...buttonProps}
          />
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
};

export default NewOrderBottomSheet;
