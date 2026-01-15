import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  View,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useCallback } from "react";
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
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import {
  formatCurrency,
  i18nAlert,
  translatePaymentMethod,
} from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useQueryClient } from "@tanstack/react-query";
import Label from "@/presentation/theme/components/label";

export default function BillScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
  const bill = useOrdersStore((state) => state.activeBill);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [discount, setDiscount] = useState("");
  const order = useOrdersStore((state) => state.activeOrder);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const [visible, setVisible] = useState(false);
  const { mutate: updateBill } = useBills().updateBill;
  const { mutate: removeBill } = useBills().removeBill;

  const onRefresh = useCallback(async () => {
    if (!order?.id) return;

    try {
      setRefreshing(true);
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Refetch bills for this order
      await queryClient.refetchQueries({
        queryKey: ["bills", order.id],
      });
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [order?.id, queryClient, t]);

  if (!bill) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  const closeModal = () => {
    setVisible(false);
  };

  const moneyReceivedOptions = [
    "5",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
    "60",
    "65",
    "70",
    "75",
    "80",
    "85",
    "90",
    "95",
    "100",
  ];
  const date = getFormattedDate(bill.createdAt);

  const payBill = () => {
    if (!paymentMethod) {
      alert(
        t(
          "errors:bill.selectPaymentMethod",
          "errors:bill.paymentMethodRequired",
        ),
      );
      return;
    }

    // Validate discount does not exceed 10%
    if (!validateDiscount()) {
      return;
    }

    if (
      paymentMethod === PaymentMethodE.CASH &&
      +receivedAmount < totalAfterDiscount
    ) {
      alert(t("bills:alerts.insufficientAmount"));
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
      name: t("bills:paymentMethods.cash"),
      value: "CASH",
      icon: "cash-outline",
    },
    {
      name: t("bills:paymentMethods.creditCard"),
      value: "CREDIT_CARD",
      icon: "card-outline",
    },
    {
      name: t("bills:paymentMethods.transfer"),
      value: "TRANSFER",
      icon: "wallet-outline",
    },
  ];
  const totalAfterDiscount = bill.total - +discount;

  // Validate discount does not exceed 10% of bill total
  const validateDiscount = () => {
    const maxDiscount = bill.total * 0.1;
    if (+discount > maxDiscount) {
      i18nAlert(
        t("bills:alerts.discountExceeded"),
        t("bills:alerts.maxDiscountAllowed", {
          amount: formatCurrency(maxDiscount),
        }),
      );
      setDiscount("");
      return false;
    }
    return true;
  };
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
            <ThemedText type="h4">{t("bills:dialogs.removeTitle")}</ThemedText>
            <ThemedText type="body1" style={tw`mt-2 mb-4`}>
              {t("bills:dialogs.removeMessage")}
            </ThemedText>

            <ThemedView style={tw`flex-row justify-end gap-2`}>
              <Button
                label={t("common:actions.cancel")}
                onPress={closeModal}
                variant="outline"
                size="small"
              />
              <Button
                label={t("common:actions.remove")}
                onPress={onRemoveBill}
                size="small"
              />
            </ThemedView>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ThemedView style={tw`px-4 pt-6 flex-1 gap-4`}>
          <ScrollView
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={primaryColor}
                colors={[primaryColor]}
              />
            }
          >
            {/* Header Section */}
            <ThemedView style={tw`mb-6 justify-center items-center`}>
              <ThemedText type="h2" style={tw`font-bold mb-1`}>
                {t("bills:list.billNumber", { number: bill.num })}
              </ThemedText>
              <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
                {date}
              </ThemedText>
              {bill.isPaid ? (
                <Label
                  color="success"
                  text={t("bills:details.paid")}
                  leftIcon="checkmark-circle"
                />
              ) : (
                <Label
                  color="warning"
                  text={t("bills:details.unpaid")}
                  leftIcon="time"
                />
              )}
            </ThemedView>

            {/* Total Amount */}
            <ThemedView
              style={tw`mb-6 pb-6 border-b border-gray-200 items-center`}
            >
              <ThemedText type="caption" style={tw`text-gray-500 mb-2`}>
                {t("bills:details.totalAmount")}
              </ThemedText>
              <ThemedText style={tw`text-5xl font-bold mb-3`}>
                {formatCurrency(totalAfterDiscount)}
              </ThemedText>
              {bill.discount > 0 && (
                <ThemedText type="body2" style={tw`text-green-600`}>
                  {t("bills:details.discount")}: -
                  {formatCurrency(bill.discount)}
                </ThemedText>
              )}
            </ThemedView>

            {/* Items List */}
            <ThemedView style={tw`mb-6`}>
              <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
                {t("bills:details.items")} ({bill.details.length})
              </ThemedText>
              <ThemedView
                style={tw`border border-gray-200 rounded-xl overflow-hidden`}
              >
                {bill.details.map((detail, index) => (
                  <ThemedView key={detail.id}>
                    <ThemedView
                      style={tw`flex-row justify-between items-center px-4 py-3`}
                    >
                      <ThemedView
                        style={tw`flex-1 flex-row items-center gap-3`}
                      >
                        <ThemedText
                          type="body2"
                          style={tw`text-gray-500 min-w-8`}
                        >
                          {detail.quantity}×
                        </ThemedText>
                        <ThemedText type="body1" style={tw`flex-1`}>
                          {detail.orderDetail.product.name}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {formatCurrency(detail.total)}
                      </ThemedText>
                    </ThemedView>
                    {index < bill.details.length - 1 && (
                      <ThemedView style={tw`h-px bg-gray-200`} />
                    )}
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>

            {!bill.isPaid ? (
              <>
                {/* Discount Section */}
                <ThemedView style={tw`mb-6`}>
                  <ThemedText type="body2" style={tw`text-gray-500 mb-2`}>
                    {t("bills:details.discount")} (Max 10%)
                  </ThemedText>
                  <TextInput
                    inputMode="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                    onBlur={validateDiscount}
                    placeholder="0.00"
                  />
                </ThemedView>

                {/* Payment Method Section */}
                <ThemedView style={tw`mb-6`}>
                  <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
                    {t("bills:details.paymentMethod")}
                  </ThemedText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`gap-2`}
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

                {/* Cash Payment Section */}
                {paymentMethod === PaymentMethodE.CASH && (
                  <ThemedView style={tw`mb-20`}>
                    <ThemedText type="body2" style={tw`text-gray-500 mb-2`}>
                      {t("bills:details.receivedAmount")}
                    </ThemedText>
                    <TextInput
                      value={receivedAmount}
                      onChangeText={setReceivedAmount}
                      inputMode="numeric"
                      placeholder="0.00"
                    />

                    {/* Quick Amount Buttons */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={tw`gap-2 mt-3 mb-3`}
                      nestedScrollEnabled
                    >
                      {moneyReceivedOptions.map((amount) => (
                        <Button
                          key={amount}
                          label={`$${amount}`}
                          variant="outline"
                          size="small"
                          onPress={() => setReceivedAmount(amount)}
                        />
                      ))}
                    </ScrollView>

                    <Button
                      label={t("bills:details.exactAmount")}
                      variant="outline"
                      onPress={() =>
                        setReceivedAmount(String(totalAfterDiscount))
                      }
                    />

                    {/* Change Display */}
                    {+receivedAmount > totalAfterDiscount && (
                      <ThemedView
                        style={tw`mt-4 p-4  rounded-xl border border-green-200 items-center`}
                      >
                        <ThemedText
                          type="caption"
                          style={tw`text-green-700 mb-1`}
                        >
                          {t("bills:details.change")}
                        </ThemedText>
                        <ThemedText
                          style={tw`text-3xl font-bold text-green-700`}
                        >
                          {formatCurrency(+receivedAmount - totalAfterDiscount)}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                )}
              </>
            ) : (
              <>
                {/* Paid Bill Summary */}
                <ThemedView style={tw`items-center py-8 mb-6`}>
                  <Ionicons
                    name="checkmark-circle"
                    size={64}
                    color={tw.color("green-500")}
                  />
                  <ThemedText
                    type="h3"
                    style={tw`font-bold text-green-600 mt-3`}
                  >
                    {t("bills:details.billPaid")}
                  </ThemedText>
                </ThemedView>

                {/* Payment Details */}
                <ThemedView
                  style={tw`border border-gray-200 rounded-xl overflow-hidden`}
                >
                  <ThemedView
                    style={tw`flex-row justify-between items-center px-4 py-3`}
                  >
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("bills:details.paymentMethod")}
                    </ThemedText>
                    <ThemedText type="body1" style={tw`font-semibold`}>
                      {translatePaymentMethod(bill.paymentMethod)}
                    </ThemedText>
                  </ThemedView>
                  {bill.discount > 0 && (
                    <>
                      <ThemedView style={tw`h-px bg-gray-200`} />
                      <ThemedView
                        style={tw`flex-row justify-between items-center px-4 py-3`}
                      >
                        <ThemedText type="body2" style={tw`text-gray-500`}>
                          {t("bills:details.discount")}
                        </ThemedText>
                        <ThemedText
                          type="body1"
                          style={tw`font-semibold text-green-600`}
                        >
                          -{formatCurrency(bill.discount)}
                        </ThemedText>
                      </ThemedView>
                    </>
                  )}
                </ThemedView>
              </>
            )}
          </ScrollView>

          {!bill.isPaid && (
            <ThemedView
              style={tw`flex-row items-center mb-4 gap-3 border-t border-gray-200 pt-4`}
            >
              <IconButton
                icon="trash-outline"
                color={tw.color("red-500")}
                onPress={() => setVisible(true)}
              />
              <ThemedView style={tw`flex-1`}>
                <Button label={t("bills:details.payBill")} onPress={payBill} />
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}
