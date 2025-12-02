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

interface SelectedDetails {
  [id: string]: {
    detail: OrderDetail;
    quantity: number;
  };
}

export default function NewBillScreen() {
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

  if (!order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>No active order</ThemedText>
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
      Alert.alert("No items selected", "Please select at least one item.");
      return;
    }

    const createBillDto: CreateBillDto = { orderId: order.id, details };

    createBill(createBillDto, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={tw`flex-row items-center justify-between gap-8`}>
        <ThemedView style={tw`gap-1 `}>
          <ThemedText type="h1">New Bill</ThemedText>
          <ThemedText type="body1">Order #{order.num}</ThemedText>
          {/* <ThemedText type="small">Today, 11:30</ThemedText> */}
        </ThemedView>
        <ThemedView>
          <ThemedText type="body1">Total</ThemedText>
          <ThemedText type="h4">${order.total}</ThemedText>
        </ThemedView>
      </ThemedView>

      <Switch
        label="Select all items"
        value={totalToPay === getTotalSelectedDetails()}
        onValueChange={(value) => {
          handleSelectAll(value);
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {detailsToPay.map((detail) => (
          <NewBillDetailCard
            key={detail.id}
            detail={detail}
            quantity={selectedDetails[detail.id]?.quantity || 0}
            onChange={(value) => handleUpdateDetail(detail, value)}
          />
        ))}
        <ThemedText type="h3" style={tw`mt-4 mb-2`}>
          Billed items
        </ThemedText>
        <ThemedView style={tw`gap-2 mb-20`}>
          {paidDetails.length === 0 && (
            <ThemedText type="body2">No billed items yet.</ThemedText>
          )}

          {paidDetails.map((detail) => (
            <ThemedText key={detail.id}>
              {detail.product.name} x{detail.quantity}
            </ThemedText>
          ))}
        </ThemedView>
      </ScrollView>

      <Button
        label={"Create bill - $" + getTotalSelectedDetails()}
        onPress={onCreateBill}
      ></Button>
    </ThemedView>
  );
}
