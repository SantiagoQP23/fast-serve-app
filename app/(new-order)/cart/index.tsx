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
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { mapStoreToCreateSaleDto } from "@/presentation/orders/mappers/createBill.mapper";
import Label from "@/presentation/theme/components/label";

export default function CartScreen() {
  const { t } = useTranslation(["common", "menu"]);
  const people = useNewOrderStore((state) => state.people);
  const cartType = useNewOrderStore((state) => state.cartType);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const notes = useNewOrderStore((state) => state.notes);
  const details = useNewOrderStore((state) => state.details);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const newOrder = useNewOrderStore();
  const { isOnline, isLoading, mutate: createOrder } = useOrders().createOrder;
  const { isLoading: createSaleIsLoading, mutate: createSale } =
    useBills().createSale;

  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const [total, setTotal] = useState(0);
  const router = useRouter();

  const openProduct = (orderDetail: NewOrderDetail) => {
    setActiveDetail(orderDetail);
    setActiveProduct(orderDetail.product);
    router.push("/(new-order)/restaurant-menu/product");
  };

  const onCreateOrder = () => {
    if (cartType === "sale") {
      const data = mapStoreToCreateSaleDto(newOrder);
      createSale(data, {
        onSuccess: (resp) => {
          resetNewOrder();
          if (resp.data) router.replace(`/(bills)/${resp.data.id}`);
        },
      });
    } else {
      const data = mapStoreToCreateOrderDto(newOrder);

      createOrder(data, {
        onSuccess: (resp) => {
          resetNewOrder();
          if (resp.data) setActiveOrder(resp.data);
          router.replace("/(new-order)/order-confirmation", {
            withAnchor: true,
          });
        },
      });
    }
  };

  useEffect(() => {
    const total = details.reduce((acc, detail) => {
      return acc + (detail.price ?? detail.product.price) * detail.quantity;
    }, 0);
    setTotal(total);
  }, [details]);

  return (
    <>
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ThemedView style={tw`flex-row justify-between items-center`}>
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="h1">{t("menu:cart.title")}</ThemedText>
            <ThemedText type="small">
              {t("menu:cart.products")} {details.length}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {cartType === "order" && (
          <ThemedView style={tw`gap-2 flex-row`}>
            <Label
              text={
                orderType === OrderType.IN_PLACE
                  ? `${t("common:labels.table")} ${table?.name}`
                  : t("common:labels.takeAway")
              }
              color="default"
              size="small"
            />
            <Label
              text={String(people)}
              leftIcon="people-outline"
              size="small"
              color="outline"
            />
          </ThemedView>
        )}
        {notes && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="caption">{t("common:labels.notes")}</ThemedText>
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
              label={t("menu:cart.addProduct")}
              variant="outline"
              onPress={() => router.push("/(new-order)/restaurant-menu")}
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
        <ThemedView style={tw`gap-4 pb-2 `}>
          <ThemedView style={tw`flex-row justify-between items-center`}>
            <ThemedText type="h3">{t("common:labels.total")}</ThemedText>
            <ThemedText type="h2">{formatCurrency(total)}</ThemedText>
          </ThemedView>
          <Button
            label={t(
              cartType === "order"
                ? "menu:cart.createOrder"
                : "menu:cart.createSale",
            )}
            onPress={onCreateOrder}
            disabled={!isOnline || isLoading || details.length === 0}
          ></Button>
        </ThemedView>
      </ScreenLayout>
    </>
  );
}
