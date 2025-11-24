import { KeyboardAvoidingView, ScrollView } from "react-native";

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
import PaymentMethodCard, {
  PaymentMethod,
} from "@/presentation/orders/components/payment-method-card";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { getFormattedDate } from "@/core/common/utils/date.util";

export default function BillScreen() {
  const router = useRouter();
  const bill = useOrdersStore((state) => state.activeBill);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  if (!bill) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>No active bill</ThemedText>
      </ThemedView>
    );
  }

  const moneyReceivedOptions = ["10", "20", "50", "100"];
  const date = getFormattedDate(bill.createdAt);

  const payBill = () => {
    if (paymentMethod === "cash" && +receivedAmount < bill.total) {
      alert("Received amount is less than the total bill amount.");
      return;
    }

    alert("Bill paid successfully!");
  };

  const paymentMethods: PaymentMethod[] = [
    {
      name: "Cash",
      value: "cash",
      icon: "cash-outline",
    },
    {
      name: "Credit Card",
      value: "credit_card",
      icon: "card-outline",
    },
    {
      name: "Transfer",
      value: "transfer",
      icon: "wallet-outline",
    },
  ];

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
      <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <ThemedView style={tw`  items-center gap-8`}>
            <ThemedView style={tw`gap-1 items-center`}>
              <ThemedText type="h3">Bill #{bill.num}</ThemedText>
              <ThemedText type="body1">{date}</ThemedText>
            </ThemedView>
            <ThemedText style={tw`text-7xl `}>${bill.total}</ThemedText>
          </ThemedView>
          <ThemedView style={tw`gap-2 mb-8 mt-8`}>
            {bill.details.map((detail) => (
              <ThemedView
                style={tw`flex-row justify-between items-center`}
                key={detail.id}
              >
                <ThemedText type="body1">
                  {detail.orderDetail.product.name} x {detail.quantity}
                  {/* {JSON.stringify(detail)} */}
                </ThemedText>
                <ThemedText>${detail.total}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
          {!bill.isPaid ? (
            <>
              <ThemedView style={tw` gap-4 `}>
                <ThemedText type="h3">Payment method</ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw` gap-2`}
                  nestedScrollEnabled
                >
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      paymentMethod={method}
                      key={method.value}
                      active={paymentMethod === method.value}
                      onPress={() => setPaymentMethod(method.value)}
                    />
                  ))}
                </ScrollView>
              </ThemedView>
              {paymentMethod === "cash" && (
                <ThemedView style={tw` gap-4 mb-20 mt-4`}>
                  <ThemedText type="h3">Received amount</ThemedText>
                  <TextInput
                    icon="cash-outline"
                    value={receivedAmount}
                    onChangeText={setReceivedAmount}
                    inputMode="numeric"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw` gap-2`}
                    nestedScrollEnabled
                  >
                    {moneyReceivedOptions.map((amount) => (
                      <Button
                        key={amount}
                        label={`$${amount}`}
                        variant="outline"
                        onPress={() => setReceivedAmount(amount)}
                      ></Button>
                    ))}
                  </ScrollView>
                  <Button
                    label="Exact amount"
                    variant="outline"
                    onPress={() => setReceivedAmount(String(bill.total))}
                  />
                  {+receivedAmount > bill.total && (
                    <ThemedView style={tw` items-center mt-4 gap-2`}>
                      <ThemedText>Change</ThemedText>
                      <ThemedText type="h1">
                        ${+receivedAmount - bill.total}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              )}
            </>
          ) : (
            <></>
          )}
        </ScrollView>

        {!bill.isPaid && <Button label="Pay bill" onPress={payBill}></Button>}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
