import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import NewBillDetailCard from "@/presentation/orders/components/new-bill-detail-card";
import Switch from "@/presentation/theme/components/switch";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  OrderDetail,
  OrderDetailStatus,
} from "@/core/orders/models/order-detail.model";
import {
  CreateBillDetailDto,
  CreateBillDto,
} from "@/core/orders/dto/create-bill.dto";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { BillsService } from "@/core/orders/services/bills.service";

interface SelectedDetails {
  [id: string]: {
    detail: OrderDetail;
    quantity: number;
  };
}

const getDetailsToPay = (details: OrderDetail[]) =>
  details.filter(
    (detail) =>
      detail.quantity !== detail.qtyPaid &&
      detail.status !== OrderDetailStatus.CANCELLED,
  );

const selectAllDetails = (details: OrderDetail[]): SelectedDetails =>
  Object.fromEntries(
    details.map((detail) => [
      detail.id,
      { detail, quantity: detail.quantity - detail.qtyPaid },
    ]),
  );

export default function NewBillScreen() {
  const { t } = useTranslation(["common", "bills", "orders"]);
  const router = useRouter();
  const order = useOrdersStore((state) => state.activeOrder);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  // "Cobrar" on the order opens this with every unbilled item selected.
  const { all } = useLocalSearchParams<{ all?: string }>();
  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails>(() =>
    all === "1" && order
      ? selectAllDetails(getDetailsToPay(order.details))
      : {},
  );
  const [idempotencyKey] = useState(() => generateIdempotencyKey());
  const { mutate: createBill, isLoading: isCreating } = useBills().createBill;

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

  const detailsToPay = getDetailsToPay(order.details);

  const totalToPay = detailsToPay.reduce((acc, detail) => {
    return acc + (detail.quantity - detail.qtyPaid) * detail.price;
  }, 0);

  const paidDetails = order.details.filter((detail) => detail.qtyPaid >= 1);

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
    setSelectedDetails(value ? selectAllDetails(detailsToPay) : {});
  };

  // The socket answers with the order, not the bill: find the newest bill
  // and open it so charging is the next tap.
  const openCreatedBill = async () => {
    try {
      const bills = await queryClient.fetchQuery({
        queryKey: ["bills", order.id],
        queryFn: () => BillsService.getBillByOrders(order.id),
        staleTime: 0,
      });
      const newest = bills.reduce<(typeof bills)[number] | null>(
        (latest, bill) => (!latest || bill.id > latest.id ? bill : latest),
        null,
      );
      if (newest) {
        router.replace(`/(bills)/${newest.id}`);
        return;
      }
    } catch {
      // Fall through: the bill exists, the order's Bills tab lists it.
    }
    router.back();
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

    // The button is disabled with nothing selected; this only guards it.
    if (details.length === 0) return;

    const createBillDto: CreateBillDto = {
      idempotencyKey,
      orderId: order.id,
      details,
    };

    createBill(createBillDto, {
      onSuccess: () => {
        openCreatedBill();
      },
    });
  };

  const selectedTotal = getTotalSelectedDetails();
  const selectedCount = getSelectedItemsCount();

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pt-6 pb-32`}
      >
        {/* Header Section */}
        <ThemedView style={tw`mb-6`}>
          <ThemedText type="h2" style={tw` mb-1`}>
            {t("bills:newBill.title")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500`}>
            {t("bills:newBill.orderNumber", { number: order.num })}
          </ThemedText>
        </ThemedView>

        {/* Order Summary */}
        {totalToPay !== order.total && (
          <ThemedView
            style={tw`flex-row justify-between items-center mb-4 pb-4 border-b border-divider`}
          >
            <ThemedView>
              <ThemedText type="small" style={tw`mb-1`}>
                {t("bills:newBill.orderTotal")}
              </ThemedText>
              <ThemedText type="body1" style={tw`font-semibold`}>
                {formatCurrency(order.total)}
              </ThemedText>
            </ThemedView>
            <ThemedView style={tw`items-end`}>
              <ThemedText type="small" style={tw`mb-1`}>
                {t("bills:newBill.remaining")}
              </ThemedText>
              <ThemedText type="body1" style={tw`font-semibold`}>
                {formatCurrency(totalToPay)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* Select All Toggle */}
        {detailsToPay.length > 0 && (
          <ThemedView style={tw`mb-4`}>
            <Switch
              label={t("bills:newBill.selectAllItems")}
              value={totalToPay === getTotalSelectedDetails() && totalToPay > 0}
              onValueChange={(value) => {
                handleSelectAll(value);
              }}
            />
          </ThemedView>
        )}

        {/* Items List */}
        {detailsToPay.length === 0 ? (
          <ThemedView style={tw`p-8 items-center gap-2`}>
            <Icon
              name="circle-check"
              size={48}
              color={tw.color("emerald-600")}
            />
            <ThemedText type="body1" style={tw`text-gray-600 text-center`}>
              {t("bills:newBill.allItemsBilled")}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-4 mb-6`}>
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

        {/* Already Billed Items Section */}
        {paidDetails.length > 0 && (
          <ThemedView style={tw`mb-6 mt-6`}>
            <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
              {t("bills:newBill.billedItems")}
            </ThemedText>
            <ThemedView
              style={tw`border border-border rounded-md overflow-hidden`}
            >
              {paidDetails.map((detail, index) => (
                <ThemedView key={detail.id} style={tw`bg-transparent`}>
                  <ThemedView
                    key={detail.id}
                    style={tw`flex-row items-center justify-between px-4 py-3 bg-transparent`}
                  >
                    <ThemedView
                      style={tw`flex-row items-center gap-2 flex-1 bg-transparent`}
                    >
                      <Icon
                        name="circle-check"
                        size={18}
                        color={tw.color("primary")}
                      />
                      <ThemedText type="body1">
                        {detail.product.name}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      × {detail.qtyPaid}
                    </ThemedText>
                  </ThemedView>
                  {index < paidDetails.length - 1 && (
                    <ThemedView style={tw`h-px bg-divider`} />
                  )}
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <ThemedView
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-background border-t border-divider px-4 pt-3`,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {selectedTotal > 0 && (
          <ThemedView style={tw`flex-row justify-between items-center mb-3`}>
            <ThemedText type="body2" style={tw`text-gray-600`}>
              {t("bills:newBill.itemsCount", { count: selectedCount })}
            </ThemedText>
            <ThemedText type="h3">{formatCurrency(selectedTotal)}</ThemedText>
          </ThemedView>
        )}
        <Button
          label={t("bills:newBill.createBill", {
            amount: formatCurrency(selectedTotal),
          })}
          onPress={onCreateBill}
          loading={isCreating}
          disabled={selectedTotal === 0 || isCreating}
        />
      </ThemedView>
    </ScreenLayout>
  );
}
