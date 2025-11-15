import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import {
  View,
  Text,
  Alert,
  ButtonProps,
  FlatList,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { OrderType, orderTypes } from "@/core/orders/enums/order-type.enum";
import { Table } from "@/core/tables/models/table.model";
import { useTables } from "@/presentation/tables/hooks/useTables";
import ButtonGroup from "@/presentation/theme/components/button-group";
import Select from "@/presentation/theme/components/select";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useNewOrderStore } from "../store/newOrderStore";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import Switch from "@/presentation/theme/components/switch";
import OrderCard, { Order } from "@/presentation/home/components/order-card";

interface TableOrdersBottomSheetProps {
  onCreateOrder?: () => void;
  buttonProps?: ButtonProps;
}

const TableOrdersBottomSheet = ({
  onCreateOrder,
  buttonProps,
}: TableOrdersBottomSheetProps) => {
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

  const orders: Order[] = [
    { num: 1, status: "pending" },
    { num: 2, status: "inProgress" },
    { num: 3, status: "delivered" },
    { num: 4, status: "pending" },
    { num: 5, status: "inProgress" },
    { num: 6, status: "delivered" },
  ];

  const validateNewOrder = () => {
    if (orderType === OrderType.IN_PLACE && !table) {
      Alert.alert("Please select a table");
      return false;
    }
    return true;
  };
  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered",
  );
  const screenWidth = Dimensions.get("window").width;

  return (
    <BottomSheetView style={tw`p-4 items-center justify-center`}>
      <ThemedView style={tw`w-full gap-6`}>
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="h2" style={tw`text-center`}>
            Table 5
          </ThemedText>
          <ThemedText type="body2" style={tw`text-center`}>
            Orders: 3 (1 Pending, 1 In Progress, 1 Delivered)
          </ThemedText>
        </ThemedView>
        <FlatList
          data={deliveredOrders}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ThemedView
              style={[
                index !== deliveredOrders.length - 1 && tw`mr-4`,
                { width: screenWidth * 0.8 },
              ]}
            >
              <OrderCard order={item} />
            </ThemedView>
          )}
          style={tw``}
        />

        <ThemedView>
          <Button
            leftIcon="add-circle-outline"
            label="Add order "
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

export default TableOrdersBottomSheet;
