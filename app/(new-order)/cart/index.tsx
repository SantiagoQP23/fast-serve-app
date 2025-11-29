import { FlatList, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import NewOrderDetailCard from "@/presentation/orders/components/new-order-detail-card";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { Product } from "@/core/menu/models/product.model";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { mapStoreToCreateOrderDto } from "@/presentation/orders/mappers/createOrder.mapper";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";

export default function CartScreen() {
  const people = useNewOrderStore((state) => state.people);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const notes = useNewOrderStore((state) => state.notes);
  const details = useNewOrderStore((state) => state.details);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  // const setActiveProduct = useNewOrderStore( (state) => state.setActiveProduct);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const newOrder = useNewOrderStore();
  const { isOnline, isLoading, mutate: createOrder } = useOrders().createOrder;
  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const [total, setTotal] = useState(0);
  const router = useRouter();

  const openProduct = (orderDetail: NewOrderDetail) => {
    setActiveDetail(orderDetail);
    setActiveProduct(orderDetail.product);
    router.push("/restaurant-menu/product");
  };

  const onCreateOrder = () => {
    const data = mapStoreToCreateOrderDto(newOrder);

    createOrder(data, {
      onSuccess: (resp) => {
        resetNewOrder();
        if (resp.data) setActiveOrder(resp.data);
        router.replace("/(new-order)/order-confirmation", { withAnchor: true });
      },
    });
  };

  useEffect(() => {
    const total = details.reduce((acc, detail) => {
      return acc + detail.product.price * detail.quantity;
    }, 0);
    setTotal(total);
  }, [details]);

  return (
    <>
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h1">Cart</ThemedText>
            <ThemedText type="small">Products: {details.length}</ThemedText>
          </ThemedView>
          <ThemedView style={tw`gap-2`}>
            <ThemedView>
              <ThemedText type="h4">
                {orderType === OrderType.IN_PLACE
                  ? `Table ${table?.name}`
                  : "Take Away"}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw` flex-row justify-end bg-transparent items-center gap-2`}
            >
              <Ionicons name="people-outline" size={18} />
              <ThemedText type="body2">{people}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        {notes && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="caption">Notes</ThemedText>
            <ThemedText type="body2">{notes}</ThemedText>
          </ThemedView>
        )}

        <FlatList
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
          data={details}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item }) => (
            <NewOrderDetailCard
              detail={item}
              onPress={() => openProduct(item)}
            />
          )}
          ListFooterComponent={
            <Button
              leftIcon="add-outline"
              label="Add product "
              variant="outline"
              onPress={() => router.push("/restaurant-menu")}
            />
          }
        />
        {/* <ScrollView */}
        {/*   style={tw`flex-1`} */}
        {/*   showsVerticalScrollIndicator={false} */}
        {/*   contentContainerStyle={tw`gap-4 pb-4`} */}
        {/* > */}
        {/*   {details.map((detail, index) => ( */}
        {/*     <OrderDetailCard key={index} detail={detail} /> */}
        {/*   ))} */}
        {/*   <Button */}
        {/*     leftIcon="add-outline" */}
        {/*     label="Add product " */}
        {/*     variant="outline" */}
        {/*     onPress={() => router.push("/restaurant-menu")} */}
        {/*   /> */}
        {/* </ScrollView> */}
      </ThemedView>

      <ThemedView style={tw`gap-4 p-4 rounded-xl shadow-xl `}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedText type="h3">Total</ThemedText>
          <ThemedText type="h2">${total}</ThemedText>
        </ThemedView>
        <Button
          label="Create order"
          onPress={onCreateOrder}
          disabled={!isOnline || isLoading}
        ></Button>
      </ThemedView>
    </>
  );
}
