import { FlatList, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import NewOrderDetailCard from "@/presentation/orders/components/new-order-detail-card";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { NewOrderDetail } from "@/core/orders/dto/new-order-detail.dto";
import { useOrders } from "@/presentation/orders/hooks/useOrders";
import { mapStoreToCreateOrderDto } from "@/presentation/orders/mappers/createOrder.mapper";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { mapStoreToCreateSaleDto } from "@/presentation/orders/mappers/createBill.mapper";
import Label from "@/presentation/theme/components/label";
import { usePrintersStore } from "@/presentation/printers/store/usePrintersStore";
import { usePrintComanda } from "@/presentation/orders/hooks/usePrintComanda";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { hasActiveSubscription } from "@/core/common/models/restaurant.model";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import SubscriptionPaywallBottomSheet from "@/presentation/subscriptions/components/subscription-paywall-bottom-sheet";
import Chip from "@/presentation/theme/components/chip";
import TextInput from "@/presentation/theme/components/text-input";
import NewOrderPeopleBottomSheet from "@/presentation/orders/components/new-order-people-bottom-sheet";
import NewOrderTableSelectorBottomSheet from "@/presentation/orders/components/new-order-table-selector-bottom-sheet";

export default function CartScreen() {
  const { t } = useTranslation(["common", "menu"]);
  const people = useNewOrderStore((state) => state.people);
  const cartType = useNewOrderStore((state) => state.cartType);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const notes = useNewOrderStore((state) => state.notes);
  const setNotes = useNewOrderStore((state) => state.setNotes);
  const details = useNewOrderStore((state) => state.details);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const newOrder = useNewOrderStore();
  const { isOnline, isLoading, mutate: createOrder } = useOrders().createOrder;
  const { mutate: createSale, isLoading: createSaleLoading } =
    useBills().createSale;

  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const printers = usePrintersStore((state) => state.printers);
  const hasActivePrinters = printers.some((printer) => printer.isActive);
  const canPrintOnCreate = cartType === "order" && hasActivePrinters;
  const { printComanda } = usePrintComanda();

  const [total, setTotal] = useState(0);
  const [printOnCreate, setPrintOnCreate] = useState(false);
  const [withNotes, setWithNotes] = useState<boolean>(!!notes);
  const router = useRouter();

  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const paywallSheetRef = useRef<BottomSheetMethods>(null);
  const closePaywall = () => paywallSheetRef.current?.close();

  const peopleSelectorSheetRef = useRef<BottomSheetMethods>(null);
  const closePeopleSelector = () => peopleSelectorSheetRef.current?.close();
  const handlePresentPeopleSelector = () =>
    peopleSelectorSheetRef.current?.present();

  const tableSelectorSheetRef = useRef<BottomSheetMethods>(null);
  const closeTableSelector = () => tableSelectorSheetRef.current?.close();
  const handlePresentTableSelector = () =>
    tableSelectorSheetRef.current?.present();

  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const newItems = useEditOrderCartStore((state) => state.newItems);
  const resetEditCart = useEditOrderCartStore((state) => state.reset);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const isEditMode = !!editOrderId && editOrderId === activeOrder?.id;
  const { isLoading: isAddingDetails, mutate: addOrderDetails } =
    useOrders().addOrderDetails;

  const openProduct = (orderDetail: NewOrderDetail) => {
    setActiveDetail(orderDetail);
    setActiveProduct(orderDetail.product);
    router.push("/(new-order)/restaurant-menu/product");
  };

  const onCreateOrder = (print: boolean) => {
    if (!hasActiveSubscription(currentRestaurant?.subscription)) {
      paywallSheetRef.current?.present();
      return;
    }

    setPrintOnCreate(print);

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
        onSuccess: async (resp) => {
          resetNewOrder();
          if (!resp.data) return;
          setActiveOrder(resp.data);

          if (print && resp.data.tickets) {
            for (const ticket of resp.data.tickets) {
              await printComanda(resp.data, ticket);
            }
          }

          router.replace("/(new-order)/order-confirmation", {
            withAnchor: true,
          });
        },
      });
    }
  };

  const onAddProductsToOrder = () => {
    if (!activeOrder) return;

    const newDetailsPayload = newItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price ?? item.product.price,
      description: item.description,
      productOptionId: item.productOption?.id,
      typeOrderDetail: item.typeOrderDetail,
      tagIds: item.tagIds,
    }));

    addOrderDetails(
      {
        orderId: activeOrder.id,
        newDetails: newDetailsPayload,
      },
      {
        onSuccess: (resp) => {
          resetEditCart();
          router.replace(`/(order)/${activeOrder.id}`);
        },
      },
    );
  };

  const onCancelEdit = () => {
    resetEditCart();
    router.back();
  };

  useEffect(() => {
    const total = details.reduce((acc, detail) => {
      return acc + (detail.price ?? detail.product.price) * detail.quantity;
    }, 0);
    setTotal(total);
  }, [details]);

  if (isEditMode) {
    return (
      <>
        <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ThemedView style={tw`flex-row justify-between items-center`}>
            <ThemedView style={tw`gap-2`}>
              <ThemedText type="h1">{t("menu:cart.title")}</ThemedText>
              <ThemedText type="small">
                {t("orders:editCart.newItems")} {newItems.length}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={tw`gap-2 flex-row`}>
            <Label
              text={
                activeOrder?.table
                  ? `${t("common:labels.table")} ${activeOrder.table.name}`
                  : t("common:labels.takeAway")
              }
              color="default"
              size="small"
            />
            <Label
              text={String(activeOrder?.people || 0)}
              leftIcon="people-outline"
              size="small"
            />
          </ThemedView>

          <FlatList
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-4 pb-4`}
            data={newItems}
            keyExtractor={(itm) =>
              itm.id || `${itm.product.id}-${Math.random()}`
            }
            renderItem={({ item }) => (
              <NewOrderDetailCard
                detail={item}
                orderType={activeOrder?.type || OrderType.IN_PLACE}
                isEditMode
                onPress={() => {
                  setActiveDetail(item);
                  setActiveProduct(item.product);
                  router.push("/(new-order)/restaurant-menu/product");
                }}
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
            ListEmptyComponent={
              <ThemedView style={tw`items-center py-12`}>
                <Ionicons
                  name="cart-outline"
                  size={48}
                  color={tw.color("gray-400")}
                />
                <ThemedText
                  type="body1"
                  style={tw`text-gray-500 mt-4 text-center`}
                >
                  {t("orders:editCart.noItems")}
                </ThemedText>
              </ThemedView>
            }
          />

          <ThemedView
            style={tw`gap-4 pb-2 flex-row justify-between items-center`}
          >
            <Button
              label={t("common:actions.cancel")}
              variant="text"
              onPress={onCancelEdit}
            />
            <Button
              label={t("orders:editCart.addProducts")}
              onPress={onAddProductsToOrder}
              disabled={!isOnline || isAddingDetails || newItems.length === 0}
              loading={isAddingDetails}
              style={tw`flex-1`}
            />
          </ThemedView>
        </ScreenLayout>
      </>
    );
  }

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

        <FlatList
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
          data={details}
          keyExtractor={(_, index) => `${index}`}
          ListHeaderComponent={
            cartType === "order" ? (
              <ThemedView style={tw`gap-4`}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`gap-2`}
                >
                  <Chip
                    icon={
                      orderType === OrderType.IN_PLACE
                        ? "restaurant-outline"
                        : "bag-outline"
                    }
                    label={
                      orderType === OrderType.IN_PLACE
                        ? `${t("common:labels.table")} ${table?.name}`
                        : t("common:labels.takeAway")
                    }
                    onPress={
                      orderType === OrderType.IN_PLACE
                        ? handlePresentTableSelector
                        : undefined
                    }
                  />
                  <Chip
                    icon="people-outline"
                    label={String(people)}
                    onPress={handlePresentPeopleSelector}
                  />
                  {!withNotes && (
                    <Chip
                      variant="assist"
                      icon="document-text-outline"
                      label={t("orders:form.addNote")}
                      onPress={() => setWithNotes(true)}
                    />
                  )}
                </ScrollView>
                {withNotes && (
                  <TextInput
                    numberOfLines={5}
                    multiline
                    scrollEnabled
                    style={tw`max-h-32`}
                    placeholder={t("orders:newOrder.notesPlaceholder")}
                    onChangeText={setNotes}
                    value={notes}
                    variant="outlined"
                  />
                )}
              </ThemedView>
            ) : undefined
          }
          renderItem={({ item }) => (
            <NewOrderDetailCard
              orderType={orderType}
              detail={item}
              onPress={() => openProduct(item)}
            />
          )}
          ListFooterComponent={
            <Button
              leftIcon="add-outline"
              label={t("menu:cart.addProduct")}
              variant="text"
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
            <ThemedText type="h4">{t("common:labels.total")}</ThemedText>
            <ThemedText type="h3">{formatCurrency(total)}</ThemedText>
          </ThemedView>
          <ThemedView
            style={[
              tw.style(
                ``,
                canPrintOnCreate
                  ? " flex-row items-center justify-between gap-2"
                  : "",
              ),
            ]}
          >
            <Button
              variant={canPrintOnCreate ? "outline" : "primary"}
              loading={(isLoading || createSaleLoading) && !printOnCreate}
              label={t(
                cartType === "order"
                  ? "menu:cart.createOrder"
                  : "menu:cart.createSale",
              )}
              onPress={() => onCreateOrder(false)}
              disabled={
                !isOnline ||
                isLoading ||
                details.length === 0 ||
                createSaleLoading
              }
              size={canPrintOnCreate ? "small" : "medium"}
            ></Button>
            {canPrintOnCreate && (
              <Button
                style={tw`flex-1`}
                leftIcon="print-outline"
                loading={(isLoading || createSaleLoading) && printOnCreate}
                label={t("menu:cart.createAndPrintOrder")}
                onPress={() => onCreateOrder(true)}
                disabled={
                  !isOnline ||
                  isLoading ||
                  details.length === 0 ||
                  createSaleLoading
                }
              />
            )}
          </ThemedView>
        </ThemedView>
      </ScreenLayout>

      <ThemedBottomSheetModal
        ref={paywallSheetRef}
        enablePanDownToClose
        snapPoints={["90%"]}
      >
        <SubscriptionPaywallBottomSheet onDismiss={closePaywall} />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={peopleSelectorSheetRef} enablePanDownToClose>
        <NewOrderPeopleBottomSheet onClose={closePeopleSelector} />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={tableSelectorSheetRef} enablePanDownToClose>
        <NewOrderTableSelectorBottomSheet onClose={closeTableSelector} />
      </ThemedBottomSheetModal>
    </>
  );
}
