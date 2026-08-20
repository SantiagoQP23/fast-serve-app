import { ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import { EditBillDto } from "@/core/orders/dto/edit-bill.dto";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, i18nAlert } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useEditOrderCartStore } from "@/presentation/orders/store/editOrderCartStore";
import { useOrder } from "@/presentation/orders/hooks/useOrder";

interface SelectedDetails {
  [id: string]: {
    detail: OrderDetail;
    quantity: number;
  };
}

export default function EditBillScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const {
    data: bill,
    isLoading,
    refetch: refetchBill,
  } = useBills().billByIdQuery(billId);
  const { mutate: editBill, isLoading: isSaving } = useBills().editBill;

  const setActiveOrder = useOrdersStore((state) => state.setActiveOrder);
  const initEditCart = useEditOrderCartStore((state) => state.init);
  const resetEditCart = useEditOrderCartStore((state) => state.reset);

  const orderId = bill?.order?.id || null;
  const {
    order,
    isLoading: isLoadingOrder,
    refetch: refetchOrder,
  } = useOrder(orderId);

  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails>({});
  const initializedRef = useRef(false);

  // Build a lookup of current bill quantities per orderDetailId.
  const billQtyByOrderDetailId = useMemo(() => {
    const map: Record<string, number> = {};
    if (!bill) return map;
    bill.details.forEach((billDetail) => {
      if (billDetail.orderDetail?.id) {
        map[billDetail.orderDetail.id] = billDetail.quantity;
      }
    });
    return map;
  }, [bill]);

  // All non-cancelled order details that can be part of the bill.
  const editableDetails = useMemo(() => {
    return (order?.details || []).filter(
      (detail) => detail.status !== OrderDetailStatus.CANCELLED,
    );
  }, [order?.details]);

  // Keep the order active for the restaurant-menu flow. Initialize the edit
  // cart and the bill selection only once so they survive refetches after the
  // user adds new products to the order from the menu.
  useEffect(() => {
    if (!order || initializedRef.current) return;

    setActiveOrder(order);
    initEditCart(order);

    const initial: SelectedDetails = {};
    editableDetails.forEach((detail) => {
      const billQty = billQtyByOrderDetailId[detail.id] || 0;
      if (billQty > 0) {
        initial[detail.id] = { detail, quantity: billQty };
      }
    });

    initializedRef.current = true;
    setSelectedDetails(initial);
  }, [
    order,
    editableDetails,
    billQtyByOrderDetailId,
    setActiveOrder,
    initEditCart,
  ]);

  // Reset the edit cart when truly leaving this screen (not when pushing the
  // restaurant-menu screen, since the screen stays mounted).
  useEffect(() => {
    return () => {
      resetEditCart();
    };
  }, [resetEditCart]);

  // Refetch order+bill when returning from the restaurant-menu screen so newly
  // added products become selectable.
  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        refetchOrder();
        refetchBill();
      }
    }, [orderId, refetchOrder, refetchBill]),
  );

  const getTotalSelectedDetails = () => {
    return Object.values(selectedDetails).reduce(
      (total, item) => total + item.quantity * item.detail.price,
      0,
    );
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedDetails).reduce(
      (count, item) => count + item.quantity,
      0,
    );
  };

  const getMaxQuantityForDetail = (detail: OrderDetail) => {
    const billQty = billQtyByOrderDetailId[detail.id] || 0;
    return detail.quantity - detail.qtyPaid + billQty;
  };

  const handleUpdateDetail = (orderDetail: OrderDetail, quantity: number) => {
    setSelectedDetails((prev) => {
      const next: SelectedDetails = { ...prev };
      if (quantity > 0) {
        next[orderDetail.id] = { detail: orderDetail, quantity };
      } else {
        delete next[orderDetail.id];
      }
      return next;
    });
  };

  const onSaveBill = () => {
    const details = Object.values(selectedDetails)
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        orderDetailId: item.detail.id,
        quantity: item.quantity,
      }));

    if (details.length === 0) {
      i18nAlert(
        t("bills:alerts.noItemsSelected"),
        t("bills:alerts.noItemsSelectedMessage"),
      );
      return;
    }

    const editBillDto: EditBillDto = {
      billId,
      details,
    };

    editBill(editBillDto, {
      onSuccess: () => {
        resetEditCart();
        router.back();
      },
    });
  };

  const selectedTotal = getTotalSelectedDetails();
  const selectedCount = getSelectedItemsCount();

  if (isLoading || isLoadingOrder) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="body2" style={tw`text-gray-400`}>
          {t("common:status.loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!bill || !order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-32`}
      >
        {/* Header Section */}
        <ThemedView style={tw`mb-6`}>
          <ThemedText type="h2" style={tw`mb-1`}>
            {t("bills:editBill.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:newBill.orderNumber", { number: order.num })}
          </ThemedText>
        </ThemedView>

        {/* Items List */}
        {editableDetails.length === 0 ? (
          <ThemedView style={tw`p-8 items-center gap-2`}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={tw.color("green-500")}
            />
            <ThemedText type="body1" style={tw`text-gray-600 text-center`}>
              {t("bills:newBill.allItemsBilled")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-4 mb-6`}>
            {editableDetails
              .filter((detail) => getMaxQuantityForDetail(detail) > 0)
              .map((detail) => (
                <NewBillDetailCard
                  key={detail.id}
                  detail={detail}
                  quantity={selectedDetails[detail.id]?.quantity || 0}
                  maxQuantity={getMaxQuantityForDetail(detail)}
                  onChange={(value) => handleUpdateDetail(detail, value)}
                />
              ))}
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <ThemedView
        style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4`}
      >
        {selectedTotal > 0 && (
          <ThemedView style={tw`flex-row justify-between items-center mb-3`}>
            <ThemedText type="caption" style={tw`text-gray-600`}>
              {selectedCount} item{selectedCount !== 1 ? "s" : ""}
            </ThemedText>
            <ThemedText type="h3">{formatCurrency(selectedTotal)}</ThemedText>
          </ThemedView>
        )}
        <Button
          label={t("bills:editBill.saveBill", {
            amount: selectedTotal.toFixed(2),
          })}
          onPress={onSaveBill}
          disabled={isSaving || selectedTotal === 0}
          loading={isSaving}
        />
      </ThemedView>
    </ScreenLayout>
  );
}
