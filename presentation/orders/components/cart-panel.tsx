import Animated from "react-native-reanimated";

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
import Icon from "@/presentation/theme/components/icon";
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
import TabBar from "@/presentation/theme/components/tab-bar";
import CartInformation from "@/presentation/orders/components/cart-information";

type CartTab = "products" | "information";

type CartRow =
  | { kind: "title" }
  | { kind: "tabs" }
  | { kind: "information" }
  | { kind: "item"; detail: NewOrderDetail; key: string };

interface CartPanelProps {
  /**
   * Rendered as a side pane next to the menu (tablet) instead of as its own
   * screen: no stack header, static title, no "add product" button.
   */
  embedded?: boolean;
}

export default function CartPanel({ embedded = false }: CartPanelProps) {
  const { t } = useTranslation(["common", "menu"]);
  const cartType = useNewOrderStore((state) => state.cartType);
  const orderType = useNewOrderStore((state) => state.orderType);
  const details = useNewOrderStore((state) => state.details);
  const resetNewOrder = useNewOrderStore((state) => state.reset);
  const setActiveDetail = useNewOrderStore((state) => state.setActiveDetail);
  const setActiveProduct = useMenuStore((state) => state.setActiveProduct);
  const newOrder = useNewOrderStore();
  const { isOnline, isLoading, mutate: createOrder } = useOrders().createOrder;
  const {
    mutate: createSale,
    isLoading: createSaleLoading,
    isOnline: isSaleOnline,
  } = useBills().createSale;
  // Orders can be taken offline (they wait in the outbox); sales can't.
  const canSubmit = cartType === "sale" ? isSaleOnline : isOnline;

  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);

  const printers = usePrintersStore((state) => state.printers);
  const hasActivePrinters = printers.some((printer) => printer.isActive);
  const canPrintOnCreate = cartType === "order" && hasActivePrinters;
  const { printComanda } = usePrintComanda();

  const [total, setTotal] = useState(0);
  const [printOnCreate, setPrintOnCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<CartTab>("products");
  const router = useRouter();
  const navigation = useNavigation();
  const { scrollY, scrollHandler } = useCollapsibleHeaderScroll();

  const currentRestaurant = useAuthStore((state) => state.currentRestaurant);
  const paywallSheetRef = useRef<BottomSheetMethods>(null);
  const closePaywall = () => paywallSheetRef.current?.close();

  const editOrderId = useEditOrderCartStore((state) => state.orderId);
  const newItems = useEditOrderCartStore((state) => state.newItems);
  const resetEditCart = useEditOrderCartStore((state) => state.reset);
  const activeOrder = useOrdersStore((state) => state.activeOrder);
  const isEditMode = !!editOrderId && editOrderId === activeOrder?.id;
  const { isLoading: isAddingDetails, mutate: addOrderDetails } =
    useOrders().addOrderDetails;

  const Container = embedded ? ThemedView : ScreenLayout;

  const renderTitle = (subtitle: string) =>
    embedded ? (
      <ThemedView style={tw`gap-1`}>
        <ThemedText type="h3">{t("menu:cart.title")}</ThemedText>
        <ThemedText type="small">{subtitle}</ThemedText>
      </ThemedView>
    ) : (
      <CollapsibleLargeTitle
        scrollY={scrollY}
        title={t("menu:cart.title")}
        subtitle={<ThemedText type="small">{subtitle}</ThemedText>}
      />
    );

  useEffect(() => {
    // Embedded in another screen: that screen owns the header
    if (embedded) return;

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
  }, [
    embedded,
    navigation,
    scrollY,
    t,
    isEditMode,
    newItems.length,
    details.length,
  ]);

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
        print,
        onSuccess: async (resp) => {
          resetNewOrder();
          if (!resp.data) return;
          setActiveOrder(resp.data);

          router.replace("/(new-order)/order-confirmation", {
            withAnchor: true,
          });

          // Print after showing the confirmation, so the waiter doesn't wait
          // on the printer. It has its own toast, and a comanda that fails
          // stays in "Tickets por imprimir".
          if (print && resp.data.tickets) {
            const order = resp.data;
            void (async () => {
              for (const ticket of order.tickets ?? []) {
                await printComanda(order, ticket);
              }
            })();
          }
        },
      });
    }
  };

  const onAddProductsToOrder = () => {
    if (!activeOrder) return;

    const newDetailsPayload = newItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price ?? item.productOption?.price,
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
      return (
        acc +
        (detail.price ?? detail.productOption?.price ?? 0) * detail.quantity
      );
    }, 0);
    setTotal(total);
  }, [details]);

  if (isEditMode) {
    return (
      <>
        <Container style={tw`px-4 pt-4 flex-1 gap-4`}>
          <Animated.FlatList
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`gap-12 pb-4`}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            data={newItems}
            keyExtractor={(itm) =>
              itm.id || `${itm.product.id}-${Math.random()}`
            }
            ListHeaderComponent={
              <ThemedView style={tw`gap-4`}>
                {renderTitle(
                  `${t("orders:editCart.newItems")} ${newItems.length}`,
                )}

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
                    leftIcon="users"
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
              embedded ? null : (
                <Button
                  leftIcon="plus"
                  label={t("menu:cart.addProduct")}
                  variant="outline"
                  onPress={() => router.push("/(new-order)/restaurant-menu")}
                />
              )
            }
            ListEmptyComponent={
              <ThemedView style={tw`items-center py-12`}>
                <Icon
                  name="shopping-cart"
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
        </Container>
      </>
    );
  }

  const detailRows: CartRow[] = details.map((detail, index) => ({
    kind: "item",
    detail,
    key: `${index}`,
  }));
  // Embedded: the title stays fixed above the list instead of scrolling away
  const titleRows: CartRow[] = embedded ? [] : [{ kind: "title" }];
  const showProducts = cartType !== "order" || activeTab === "products";
  const cartListData: CartRow[] =
    cartType === "order"
      ? [
          ...titleRows,
          { kind: "tabs" },
          ...(showProducts ? detailRows : [{ kind: "information" } as const]),
        ]
      : [...titleRows, ...detailRows];
  const cartSubtitle = `${t("menu:cart.products")} ${details.length}`;

  return (
    <>
      <Container style={tw`px-4 ${embedded ? "pt-4" : "pt-8"} flex-1 gap-4`}>
        {embedded && renderTitle(cartSubtitle)}
        <Animated.FlatList
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-4`}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          stickyHeaderIndices={cartType === "order" ? [titleRows.length] : []}
          data={cartListData}
          keyExtractor={(row) => (row.kind === "item" ? row.key : row.kind)}
          renderItem={({ item: row, index }) => {
            if (row.kind === "title") {
              return renderTitle(cartSubtitle);
            }

            if (row.kind === "tabs") {
              return (
                <ThemedView style={tw`bg-background pb-2`}>
                  <TabBar
                    tabs={[
                      {
                        label: t("menu:cart.tabs.products"),
                        value: "products" as const,
                        count: details.length,
                      },
                      {
                        label: t("menu:cart.tabs.information"),
                        value: "information" as const,
                      },
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    fullWidth={false}
                  />
                </ThemedView>
              );
            }

            if (row.kind === "information") {
              return <CartInformation />;
            }

            // Extra spacing between consecutive products on top of the list gap
            const followsItem = cartListData[index - 1]?.kind === "item";

            return (
              <ThemedView style={tw.style(followsItem && "mt-4")}>
                <NewOrderDetailCard
                  orderType={orderType}
                  detail={row.detail}
                  onPress={() => openProduct(row.detail)}
                />
              </ThemedView>
            );
          }}
          ListFooterComponent={
            !showProducts ? null : !embedded ? (
              <Button
                leftIcon="plus"
                label={t("menu:cart.addProduct")}
                variant="text"
                onPress={() => router.push("/(new-order)/restaurant-menu")}
              />
            ) : details.length === 0 ? (
              <ThemedView style={tw`items-center py-12`}>
                <Icon
                  name="shopping-cart"
                  size={48}
                  color={tw.color("gray-400")}
                />
                <ThemedText
                  type="body1"
                  style={tw`text-gray-500 mt-4 text-center`}
                >
                  {t("menu:cart.empty")}
                </ThemedText>
              </ThemedView>
            ) : null
          }
        />
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
                !canSubmit ||
                isLoading ||
                details.length === 0 ||
                createSaleLoading
              }
              size={canPrintOnCreate ? "small" : "medium"}
            ></Button>
            {canPrintOnCreate && (
              <Button
                style={tw`flex-1`}
                leftIcon="printer"
                loading={(isLoading || createSaleLoading) && printOnCreate}
                label={t("menu:cart.createAndPrintOrder")}
                onPress={() => onCreateOrder(true)}
                disabled={
                  !canSubmit ||
                  isLoading ||
                  details.length === 0 ||
                  createSaleLoading
                }
              />
            )}
          </ThemedView>
        </ThemedView>
      </Container>

      <ThemedBottomSheetModal
        ref={paywallSheetRef}
        enablePanDownToClose
        snapPoints={["90%"]}
      >
        <SubscriptionPaywallBottomSheet onDismiss={closePaywall} />
      </ThemedBottomSheetModal>
    </>
  );
}
