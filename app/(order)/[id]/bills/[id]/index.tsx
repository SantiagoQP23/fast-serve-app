import { KeyboardAvoidingView, Modal, ScrollView, View } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import PaymentMethodCard, {
  PaymentMethod,
} from "@/presentation/orders/components/payment-method-card";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { getFormattedDate } from "@/core/common/utils/date.util";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { UpdateBillDto } from "@/core/orders/dto/update-bill.dto";
import { PaymentMethod as PaymentMethodE } from "@/core/orders/enums/payment-method";
import IconButton from "@/presentation/theme/components/icon-button";

export default function BillScreen() {
  const router = useRouter();
  const bill = useOrdersStore((state) => state.activeBill);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState("");
  const order = useOrdersStore((state) => state.activeOrder);

  const [visible, setVisible] = useState(false);
  const { mutate: updateBill } = useBills().updateBill;
  const { mutate: removeBill } = useBills().removeBill;

  if (!bill) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>No active bill</ThemedText>
      </ThemedView>
    );
  }

  const closeModal = () => {
    setVisible(false);
  };

  const moneyReceivedOptions = ["10", "20", "50", "100"];
  const date = getFormattedDate(bill.createdAt);

  const payBill = () => {
    if (
      paymentMethod === PaymentMethodE.CASH &&
      +receivedAmount < totalAfterDiscount
    ) {
      alert("Received amount is less than the total bill amount.");
      return;
    }

    const data: UpdateBillDto = {
      id: bill.id,
      discount: +discount,
      paymentMethod,
      receivedAmount: +receivedAmount,
      isPaid: true,
      // cashRegisterId: activeCashRegister!.id,
    };

    updateBill(data, {
      onSuccess: (order) => {
        router.back();
      },
    });
  };

  const paymentMethods: PaymentMethod[] = [
    {
      name: "Cash",
      value: "CASH",
      icon: "cash-outline",
    },
    {
      name: "Credit Card",
      value: "CREDIT_CARD",
      icon: "card-outline",
    },
    {
      name: "Transfer",
      value: "TRANSFER",
      icon: "wallet-outline",
    },
  ];
  const totalAfterDiscount = bill.total - +discount;
  const onRemoveBill = () => {
    removeBill(
      { id: bill.id },
      {
        onSuccess: () => {
          closeModal();
          router.back();
        },
      },
    );
  };

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        {/* Backdrop */}
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          {/* Modal card */}
          <View style={tw`bg-white rounded-2xl w-4/5 p-5 shadow-lg`}>
            <ThemedText type="h4">Remove Bill</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              Are you sure you want to remove this bill? This action cannot be
              undone.
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label="Cancel"
                onPress={closeModal}
                variant="outline"
                size="small"
              />
              <Button label="Remove" onPress={onRemoveBill} size="small" />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
          <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
            <ThemedView style={tw`  items-center gap-8`}>
              <ThemedView style={tw`gap-1 items-center`}>
                <ThemedText type="h3">Bill #{bill.num}</ThemedText>
                <ThemedText type="body1">{date}</ThemedText>
              </ThemedView>
              <ThemedText style={tw`text-7xl `}>
                ${totalAfterDiscount}
              </ThemedText>
            </ThemedView>
            <ThemedView
              style={tw`gap-2 mb-4 mt-8 border border-gray-200 p-4 rounded-lg`}
            >
              {bill.details.map((detail) => (
                <ThemedView
                  style={tw`flex-row justify-between items-center`}
                  key={detail.id}
                >
                  <ThemedText type="body1">
                    {detail.quantity} {detail.orderDetail.product.name}
                    {/* {JSON.stringify(detail)} */}
                  </ThemedText>
                  <ThemedText>${detail.total}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
            {!bill.isPaid ? (
              <>
                <ThemedView
                  style={tw`gap-2 mb-8 mt-4 border border-gray-200 p-4 rounded-lg`}
                >
                  <TextInput
                    label="Discount "
                    inputMode="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                  />
                </ThemedView>
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
                {paymentMethod === PaymentMethodE.CASH && (
                  <ThemedView
                    style={tw` gap-4 mb-20 mt-8 border border-gray-200 p-4 rounded-lg`}
                  >
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
                      onPress={() =>
                        setReceivedAmount(String(totalAfterDiscount))
                      }
                    />
                    {+receivedAmount > bill.total && (
                      <ThemedView style={tw` items-center mt-4 gap-2`}>
                        <ThemedText>Change</ThemedText>
                        <ThemedText type="h1">
                          ${+receivedAmount - totalAfterDiscount}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                )}
              </>
            ) : (
              <>
                <ThemedView style={tw` items-center mt-8 gap-2`}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={64}
                    color={tw.color("green-500")}
                  />
                  <ThemedText type="h2">Bill Paid</ThemedText>
                </ThemedView>
                <ThemedView style={tw`mt-8 gap-4`}>
                  <ThemedText>Payment method: {bill.paymentMethod}</ThemedText>
                  <ThemedText>Discount: ${bill.discount}</ThemedText>
                </ThemedView>
              </>
            )}
          </ScrollView>

          {!bill.isPaid && (
            <ThemedView
              style={tw`flex-row justify-between items-center mb-4 gap-4`}
            >
              <IconButton
                icon="trash-outline"
                color={tw.color("red-500")}
                onPress={() => setVisible(true)}
              />
              <ThemedView style={tw`flex-1 `}>
                <Button label="Pay bill" onPress={payBill}></Button>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}
