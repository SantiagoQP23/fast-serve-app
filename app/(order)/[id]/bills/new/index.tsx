import { Alert, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useNewOrderStore } from "@/presentation/orders/store/newOrderStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderType } from "@/core/orders/enums/order-type.enum";
import Button from "@/presentation/theme/components/button";
import BillCard from "@/presentation/orders/components/bill-card";
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import Switch from "@/presentation/theme/components/switch";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { OrderDetail } from "@/core/orders/models/order-detail.model";
import {
  CreateBillDetailDto,
  CreateBillDto,
} from "@/core/orders/dto/create-bill.dto";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, i18nAlert } from "@/core/i18n/utils";
import Label from "@/presentation/theme/components/label";

interface SelectedDetails {
  [id: string]: {
    detail: OrderDetail;
    quantity: number;
  };
}

export default function NewBillScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails>({});
  const { mutate: createBill } = useBills().createBill;

  const getTotalSelectedDetails = () => {
    let total = 0;
    Object.keys(selectedDetails).forEach((id) => {
      const selectedDetail = selectedDetails[id];
      total += selectedDetail.quantity * selectedDetail.detail.price;
    });
    return total;
  };

  const getSelectedItemsCount = () => {
    let count = 0;
    Object.keys(selectedDetails).forEach((id) => {
      count += selectedDetails[id].quantity;
    });
    return count;
  };

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("orders:details.noActiveOrder")}</ThemedText>
      </ThemedView>
    );
  }

  const detailsToPay = order.details.filter(
    (detail) => detail.quantity !== detail.qtyPaid,
  );

  const totalToPay = detailsToPay.reduce((acc, detail) => {
    return acc + (detail.quantity - detail.qtyPaid) * detail.price;
  }, 0);

  const paidDetails = order.details.filter(
    (detail) => detail.quantity === detail.qtyPaid,
  );

  const handleUpdateDetail = (orderDetail: OrderDetail, quantity: number) => {
    setSelectedDetails((prev) => {
      const newSelectedDetails: SelectedDetails = { ...prev };

      newSelectedDetails[orderDetail.id] = {
        detail: orderDetail,
        quantity,
      };
      return newSelectedDetails;
    });
  };

  const handleSelectAll = (value: boolean) => {
    const newSelectedDetails: SelectedDetails = {};

    if (value) {
      detailsToPay.forEach((detail) => {
        newSelectedDetails[detail.id] = {
          detail,
          quantity: detail.quantity - detail.qtyPaid,
        };
      });
    }

    setSelectAll(value);
    setSelectedDetails(newSelectedDetails);
  };

  const onCreateBill = () => {
    const details: CreateBillDetailDto[] = [];

    Object.keys(selectedDetails).forEach((id) => {
      const selectedDetail = selectedDetails[id];
      if (selectedDetail.quantity > 0) {
        details.push({
          orderDetailId: selectedDetail.detail.id,
          quantity: selectedDetail.quantity,
        });
      }
    });

    if (details.length === 0) {
      i18nAlert(
        t("bills:alerts.noItemsSelected"),
        t("bills:alerts.noItemsSelectedMessage"),
      );
      return;
    }

    const createBillDto: CreateBillDto = { orderId: order.id, details };

    createBill(createBillDto, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  const selectedTotal = getTotalSelectedDetails();
  const selectedCount = getSelectedItemsCount();

  return (
    <ThemedView style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-32`}
      >
        {/* Header Section */}
        <ThemedView style={tw`gap-4 mb-6`}>
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <ThemedView style={tw`bg-blue-500/10 p-3 rounded-full`}>
              <Ionicons
                name="receipt-outline"
                size={28}
                color={tw.color("blue-600")}
              />
            </ThemedView>
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="h2" style={tw`font-bold`}>
                {t("bills:newBill.title")}
              </ThemedText>
              <ThemedView style={tw`flex-row items-center gap-1.5 mt-1`}>
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={tw.color("gray-500")}
                />
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("bills:newBill.orderNumber", { number: order.num })}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Order Summary Card */}
          <ThemedView
            style={tw`bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200`}
          >
            <ThemedView style={tw`flex-row justify-between items-center`}>
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="caption" style={tw`text-gray-600`}>
                  {t("common:labels.total")} Order
                </ThemedText>
                <ThemedText type="h3" style={tw`font-bold`}>
                  {formatCurrency(order.total)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={tw`gap-1 items-end`}>
                <ThemedText type="caption" style={tw`text-gray-600`}>
                  To Pay
                </ThemedText>
                <ThemedText type="h3" style={tw`font-bold text-blue-600`}>
                  {formatCurrency(totalToPay)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Select All Toggle */}
        <ThemedView style={tw`mb-4`}>
          <Switch
            label={t("bills:newBill.selectAllItems")}
            value={totalToPay === getTotalSelectedDetails() && totalToPay > 0}
            onValueChange={(value) => {
              handleSelectAll(value);
            }}
          />
        </ThemedView>

        {/* Unpaid Items Section */}
        <ThemedView style={tw`mb-6`}>
          <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Ionicons
                name="list-outline"
                size={20}
                color={tw.color("gray-700")}
              />
              <ThemedText type="h4" style={tw`font-semibold`}>
                Items
              </ThemedText>
            </ThemedView>
            <Label color="info" text={`${detailsToPay.length} items`} />
          </ThemedView>

          {detailsToPay.length === 0 ? (
            <ThemedView
              style={tw`p-8 items-center gap-3 bg-gray-50 rounded-2xl border border-gray-200`}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color={tw.color("green-500")}
              />
              <ThemedText type="body1" style={tw`text-gray-600 text-center`}>
                All items have been billed
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={tw`gap-2`}>
              {detailsToPay.map((detail) => (
                <NewBillDetailCard
                  key={detail.id}
                  detail={detail}
                  quantity={selectedDetails[detail.id]?.quantity || 0}
                  onChange={(value) => handleUpdateDetail(detail, value)}
                />
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {/* Already Billed Items Section */}
        {paidDetails.length > 0 && (
          <ThemedView style={tw`mb-6`}>
            <ThemedView style={tw`flex-row items-center justify-between mb-3`}>
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={tw.color("green-600")}
                />
                <ThemedText type="h4" style={tw`font-semibold`}>
                  {t("bills:newBill.billedItems")}
                </ThemedText>
              </ThemedView>
              <Label color="success" text={`${paidDetails.length} items`} />
            </ThemedView>

            <ThemedView
              style={tw`border border-green-200 rounded-2xl overflow-hidden bg-green-50/50`}
            >
              {paidDetails.map((detail, index) => (
                <ThemedView key={detail.id}>
                  <ThemedView
                    style={tw`flex-row items-center justify-between px-4 py-3`}
                  >
                    <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
                      <ThemedView style={tw`bg-green-500/10 p-2 rounded-full`}>
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={tw.color("green-600")}
                        />
                      </ThemedView>
                      <ThemedView style={tw`flex-1`}>
                        <ThemedText type="body1" style={tw`font-medium`}>
                          {detail.product.name}
                        </ThemedText>
                        <ThemedText type="caption" style={tw`text-gray-500`}>
                          Quantity: {detail.quantity}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <Label color="success" text="Paid" />
                  </ThemedView>
                  {index < paidDetails.length - 1 && (
                    <ThemedView style={tw`h-px bg-green-200/50 mx-4`} />
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {paidDetails.length === 0 && (
          <ThemedView
            style={tw`p-6 items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200`}
          >
            <Ionicons
              name="information-circle-outline"
              size={32}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("bills:newBill.noBilledItems")}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <ThemedView
        style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg`}
      >
        {selectedTotal > 0 && (
          <ThemedView
            style={tw`flex-row justify-between items-center mb-3 px-1`}
          >
            <ThemedView style={tw`gap-0.5`}>
              <ThemedText type="caption" style={tw`text-gray-600`}>
                Selected: {selectedCount} item{selectedCount !== 1 ? "s" : ""}
              </ThemedText>
              <ThemedText type="h3" style={tw`font-bold`}>
                {formatCurrency(selectedTotal)}
              </ThemedText>
            </ThemedView>
            <ThemedView style={tw`bg-blue-500/10 px-4 py-2 rounded-full`}>
              <ThemedText type="body2" style={tw`text-blue-600 font-semibold`}>
                {((selectedTotal / totalToPay) * 100).toFixed(0)}% of total
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        <Button
          label={
            selectedTotal > 0
              ? t("bills:newBill.createBill", {
                  amount: selectedTotal.toFixed(2),
                })
              : t("bills:newBill.createBill", { amount: "0.00" })
          }
          onPress={onCreateBill}
          leftIcon="receipt-outline"
          size="large"
          disabled={selectedTotal === 0}
        />
      </ThemedView>
    </ThemedView>
  );
}
