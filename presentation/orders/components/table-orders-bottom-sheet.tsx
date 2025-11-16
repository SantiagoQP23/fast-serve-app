import {
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  View,
  Text,
  Alert,
  ButtonProps,
  Dimensions,
  ScrollView,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
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

  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

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

  const renderOrderItem = useCallback(
    ({ item, index }: { item: Order; index: number }) => (
      <ThemedView
        style={[
          index !== deliveredOrders.length - 1 && tw`mr-4`,
          { width: screenWidth * 0.8 },
        ]}
      >
        <OrderCard order={item} />
      </ThemedView>
    ),
    [deliveredOrders.length, screenWidth],
  );

  return (
    <>
      <BottomSheetView style={tw`p-4 items-center justify-center h-auto`}>
        <ThemedView style={tw`w-full gap-6`}>
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h2" style={tw`text-center`}>
              Table 5
            </ThemedText>
            <ThemedText type="body2" style={tw`text-center`}>
              Orders: 3 (1 Pending, 1 In Progress, 1 Delivered)
            </ThemedText>
          </ThemedView>
          {/* <ScrollView */}
          {/*   horizontal */}
          {/*   showsHorizontalScrollIndicator={false} */}
          {/*   contentContainerStyle={tw`pb-4 gap-4`} */}
          {/* > */}
          {/*   { */}
          {/**/}
          {/*     deliveredOrders.length > 0 && */}
          {/*       deliveredOrders.map((order, index) => ( */}
          {/*         <ThemedView */}
          {/*           key={order.num} */}
          {/*           style={[index !== deliveredOrders.length - 1 && tw`mb-4`]} */}
          {/*         > */}
          {/*           <OrderCard order={order} /> */}
          {/*         </ThemedView> */}
          {/*       )) */}
          {/*   } */}
          {/* </ScrollView> */}
          <ScrollView contentContainerStyle={tw`pb-4 gap-4 flex-1 h-100 `}>
            {orders.length > 0 &&
              orders.map((order, index) => (
                <ThemedView key={order.num}>
                  <OrderCard order={order} />
                </ThemedView>
              ))}
          </ScrollView>
          {/* <BottomSheetScrollView */}
          {/*   contentContainerStyle={tw`pb-4 gap-4 flex-1 h-100 `} */}
          {/* > */}
          {/*   {orders.length > 0 && */}
          {/*     orders.map((order, index) => ( */}
          {/*       <ThemedView */}
          {/*         key={order.num} */}
          {/*         style={[index !== orders.length - 1 && tw`mb-4`]} */}
          {/*       > */}
          {/*         <OrderCard order={order} /> */}
          {/*       </ThemedView> */}
          {/*     ))} */}
          {/* </BottomSheetScrollView> */}

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
    </>
  );
};

export default TableOrdersBottomSheet;
