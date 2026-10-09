import { Platform, Pressable, ScrollView } from "react-native";
import Animated from "react-native-reanimated";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { toast } from "sonner-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import {
  CollapsibleHeaderTitle,
  CollapsibleLargeTitle,
  useCollapsibleHeaderScroll,
} from "@/presentation/theme/components/collapsible-header-title";
import tw from "@/presentation/theme/lib/tailwind";
import { useEffect, useRef, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
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
import TableSelectorBottomSheet, {
  type TableSelectorBottomSheetRef,
} from "@/presentation/orders/components/table-selector-bottom-sheet";

type CartRow =
  | { kind: "title" }
  | { kind: "chips" }
  | { kind: "extras" }
  | { kind: "item"; detail: NewOrderDetail; key: string };

export default function CartScreen() {
  const { t } = useTranslation(["common", "menu"]);
  const people = useNewOrderStore((state) => state.people);
  const cartType = useNewOrderStore((state) => state.cartType);
  const orderType = useNewOrderStore((state) => state.orderType);
  const table = useNewOrderStore((state) => state.table);
  const setTable = useNewOrderStore((state) => state.setTable);
  const notes = useNewOrderStore((state) => state.notes);
  const setNotes = useNewOrderStore((state) => state.setNotes);
  const deliveryTime = useNewOrderStore((state) => state.deliveryTime);
  const setDeliveryTime = useNewOrderStore((state) => state.setDeliveryTime);
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
  const navigation = useNavigation();
  const { scrollY, scrollHandler } = useCollapsibleHeaderScroll();

  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const paywallSheetRef = useRef<BottomSheetMethods>(null);
  const closePaywall = () => paywallSheetRef.current?.close();

  const peopleSelectorSheetRef = useRef<BottomSheetMethods>(null);
  const closePeopleSelector = () => peopleSelectorSheetRef.current?.close();
  const handlePresentPeopleSelector = () =>
    peopleSelectorSheetRef.current?.present();

  const tableSelectorSheetRef = useRef<TableSelectorBottomSheetRef>(null);
  const handlePresentTableSelector = () =>
    tableSelectorSheetRef.current?.present();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());

  const openTimePicker = () => {
    setPickerValue(deliveryTime ?? new Date());
    setShowTimePicker(true);
  };
  const closeTimePicker = () => setShowTimePicker(false);

  const commitDeliveryTime = (selectedDate: Date) => {
    if (!dayjs(selectedDate).isAfter(dayjs())) {
      toast.error(t("orders:alerts.deliveryTimeInPast"));
      return;
    }
    setDeliveryTime(selectedDate);
    closeTimePicker();
  };

  // On iOS the spinner stays inline and fires onChange continuously as the
  // user scrolls, so we only track the selection locally and commit it on
  // "Confirm". Android's native dialog is a single-shot pick that commits
  // and closes immediately.
  const handleTimeChange = (_: unknown, selectedDate?: Date) => {
    if (!selectedDate) return;

    setPickerValue(selectedDate);

    if (Platform.OS === "android") {
      setShowTimePicker(false);
      commitDeliveryTime(selectedDate);
    }
  };

  const handleConfirmTime = () => {
    commitDeliveryTime(pickerValue);
  };

  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const newItems = useEditOrderCartStore((state) => state.newItems);
  const resetEditCart = useEditOrderCartStore((state) => state.reset);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const isEditMode = !!editOrderId && editOrderId === activeOrder?.id;
  const { isLoading: isAddingDetails, mutate: addOrderDetails } =
    useOrders().addOrderDetails;

  useEffect(() => {
    const subtitle = isEditMode
      ? `${t("orders:editCart.newItems")} ${newItems.length}`
      : `${t("menu:cart.products")} ${details.length}`;

    navigation.setOptions({
      headerTitle: () => (
        <CollapsibleHeaderTitle
          scrollY={scrollY}
          title={t("menu:cart.title")}
          subtitle={subtitle}
        />
      ),
    });
  }, [navigation, scrollY, t, isEditMode, newItems.length, details.length]);

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
        <ScreenLayout style={tw`px-4 pt-4 flex-1 gap-4`}>
          <Animated.FlatList
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-4 pb-4`}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            data={newItems}
            keyExtractor={(itm) =>
              itm.id || `${itm.product.id}-${Math.random()}`
            }
            ListHeaderComponent={
              <ThemedView style={tw`gap-4`}>
                <CollapsibleLargeTitle
                  scrollY={scrollY}
                  title={t("menu:cart.title")}
                  subtitle={
                    <ThemedText type="small">
                      {t("orders:editCart.newItems")} {newItems.length}
                    </ThemedText>
                  }
                />

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
              </ThemedView>
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

  const hasExtras = showTimePicker || withNotes;
  const detailRows: CartRow[] = details.map((detail, index) => ({
    kind: "item",
    detail,
    key: `${index}`,
  }));
  const cartListData: CartRow[] =
    cartType === "order"
      ? [
          { kind: "title" },
          { kind: "chips" },
          ...(hasExtras ? [{ kind: "extras" } as const] : []),
          ...detailRows,
        ]
      : [{ kind: "title" }, ...detailRows];

  return (
    <>
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <Animated.FlatList
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          stickyHeaderIndices={cartType === "order" ? [1] : []}
          data={cartListData}
          keyExtractor={(row) => (row.kind === "item" ? row.key : row.kind)}
          renderItem={({ item: row }) => {
            if (row.kind === "title") {
              return (
                <CollapsibleLargeTitle
                  scrollY={scrollY}
                  title={t("menu:cart.title")}
                  subtitle={
                    <ThemedText type="small">
                      {t("menu:cart.products")} {details.length}
                    </ThemedText>
                  }
                />
              );
            }

            if (row.kind === "chips") {
              return (
                <ThemedView style={tw`bg-light-background py-1`}>
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
                    {deliveryTime ? (
                      <Chip
                        icon="time-outline"
                        label={dayjs(deliveryTime).format("HH:mm")}
                        onPress={openTimePicker}
                        rightContent={
                          <Pressable
                            onPress={() => setDeliveryTime(null)}
                            hitSlop={8}
                          >
                            <Ionicons
                              name="close"
                              size={16}
                              color={tw.color("gray-600")}
                            />
                          </Pressable>
                        }
                      />
                    ) : (
                      <Chip
                        variant="assist"
                        icon="time-outline"
                        label={t("orders:form.addDeliveryTime")}
                        onPress={openTimePicker}
                      />
                    )}
                    {!withNotes && (
                      <Chip
                        variant="assist"
                        icon="document-text-outline"
                        label={t("orders:form.addNote")}
                        onPress={() => setWithNotes(true)}
                      />
                    )}
                  </ScrollView>
                </ThemedView>
              );
            }

            if (row.kind === "extras") {
              return (
                <ThemedView style={tw`gap-4`}>
                  {showTimePicker && (
                    <ThemedView>
                      {Platform.OS === "ios" && (
                        <ThemedView
                          style={tw`border border-gray-300 rounded-2xl overflow-hidden`}
                        >
                          <DateTimePicker
                            value={pickerValue}
                            mode="time"
                            display="spinner"
                            onChange={handleTimeChange}
                          />
                          <Button
                            label={t("common:actions.confirm")}
                            onPress={handleConfirmTime}
                            variant="primary"
                            size="small"
                          />
                        </ThemedView>
                      )}
                      {Platform.OS === "android" && (
                        <DateTimePicker
                          value={pickerValue}
                          mode="time"
                          is24Hour
                          display="default"
                          onChange={handleTimeChange}
                        />
                      )}
                    </ThemedView>
                  )}
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
                      containerStyle={tw`bg-transparent border-0 p-0`}
                    />
                  )}
                </ThemedView>
              );
            }

            return (
              <NewOrderDetailCard
                orderType={orderType}
                detail={row.detail}
                onPress={() => openProduct(row.detail)}
              />
            );
          }}
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

      <TableSelectorBottomSheet
        ref={tableSelectorSheetRef}
        selectedTableId={table?.id}
        onSelectTable={(selected) => setTable(selected)}
      />
    </>
  );
}
