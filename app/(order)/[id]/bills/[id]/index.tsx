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
import { formatCurrency, i18nAlert } from "@/core/i18n/utils";
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <ThemedView style={tw`items-center gap-4 mb-6`}>
              <ThemedView style={tw`bg-blue-500/10 p-4 rounded-full`}>
                <Ionicons 
                  name="receipt-outline" 
                  size={40} 
                  color={tw.color("blue-600")} 
                />
              </ThemedView>
              <ThemedView style={tw`gap-1 items-center`}>
                <ThemedText type="h3" style={tw`font-bold`}>
                  {t("bills:list.billNumber", { number: bill.num })}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-1.5`}>
                  <Ionicons 
                    name="time-outline" 
                    size={16} 
                    color={tw.color("gray-500")} 
                  />
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {date}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              {/* Status Badge */}
              {bill.isPaid ? (
                <Label 
                  color="success" 
                  text={t("bills:details.paid")} 
                  leftIcon="checkmark-circle-outline"
                />
              ) : (
                <Label 
                  color="warning" 
                  text={t("bills:details.unpaid")} 
                  leftIcon="time-outline"
                />
              )}
            </ThemedView>

            {/* Total Amount Card */}
            <ThemedView style={tw`bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl items-center gap-2 mb-6 shadow-sm border border-blue-200`}>
              <ThemedText type="body2" style={tw`text-gray-600 font-medium`}>
                {t("bills:details.totalAmount")}
              </ThemedText>
              <ThemedText style={tw`text-6xl font-bold text-gray-900`}>
                {formatCurrency(totalAfterDiscount)}
              </ThemedText>
              {bill.discount > 0 && (
                <ThemedView style={tw`bg-green-500/10 px-4 py-2 rounded-full mt-2`}>
                  <ThemedText type="body2" style={tw`text-green-700 font-semibold`}>
                    {t("bills:details.discount")}: -{formatCurrency(bill.discount)}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Items Section */}
            <ThemedView style={tw`mb-6`}>
              <ThemedView style={tw`flex-row items-center gap-2 mb-3`}>
                <Ionicons 
                  name="list-outline" 
                  size={20} 
                  color={tw.color("gray-700")} 
                />
                <ThemedText type="h4" style={tw`font-semibold`}>
                  {t("bills:details.items")} ({bill.details.length})
                </ThemedText>
              </ThemedView>
              <ThemedView
                style={tw`gap-3 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm`}
              >
                {bill.details.map((detail, index) => (
                  <ThemedView key={detail.id}>
                    <ThemedView
                      style={tw`flex-row justify-between items-center px-4 py-3`}
                    >
                      <ThemedView style={tw`flex-1 flex-row items-center gap-3`}>
                        <ThemedView style={tw`bg-blue-500/10 px-2.5 py-1 rounded-lg min-w-10 items-center`}>
                          <ThemedText type="body2" style={tw`font-bold text-blue-600`}>
                            {detail.quantity}x
                          </ThemedText>
                        </ThemedView>
                        <ThemedText type="body1" style={tw`flex-1`}>
                          {detail.orderDetail.product.name}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="body1" style={tw`font-semibold`}>
                        {formatCurrency(detail.total)}
                      </ThemedText>
                    </ThemedView>
                    {index < bill.details.length - 1 && (
                      <ThemedView style={tw`h-px bg-gray-100 mx-4`} />
                    )}
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
            {!bill.isPaid ? (
              <>
                {/* Discount Section */}
                <ThemedView style={tw`mb-6`}>
                  <ThemedView style={tw`flex-row items-center gap-2 mb-3`}>
                    <Ionicons 
                      name="pricetag-outline" 
                      size={20} 
                      color={tw.color("gray-700")} 
                    />
                    <ThemedText type="h4" style={tw`font-semibold`}>
                      {t("bills:details.discount")} (Max 10%)
                    </ThemedText>
                  </ThemedView>
                  <TextInput
                    label={t("bills:details.discount")}
                    inputMode="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                    onBlur={validateDiscount}
                    icon="pricetag-outline"
                    placeholder="0.00"
                  />
                </ThemedView>

                {/* Payment Method Section */}
                <ThemedView style={tw`gap-4 mb-6`}>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <Ionicons 
                      name="wallet-outline" 
                      size={20} 
                      color={tw.color("gray-700")} 
                    />
                    <ThemedText type="h4" style={tw`font-semibold`}>
                      {t("bills:details.paymentMethod")}
                    </ThemedText>
                  </ThemedView>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`gap-3 px-1`}
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
                  <ThemedView
                    style={tw`gap-4 mb-20 border border-gray-200 p-5 rounded-2xl bg-gray-50`}
                  >
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons 
                        name="cash-outline" 
                        size={20} 
                        color={tw.color("gray-700")} 
                      />
                      <ThemedText type="h4" style={tw`font-semibold`}>
                        {t("bills:details.receivedAmount")}
                      </ThemedText>
                    </ThemedView>
                    <TextInput
                      icon="cash-outline"
                      value={receivedAmount}
                      onChangeText={setReceivedAmount}
                      inputMode="numeric"
                      placeholder="0.00"
                    />
                    
                    {/* Quick Amount Buttons */}
                    <ThemedView style={tw`gap-2`}>
                      <ThemedText type="body2" style={tw`text-gray-600`}>
                        Quick amounts
                      </ThemedText>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={tw`gap-2`}
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
                    </ThemedView>

                    <Button
                      label={t("bills:details.exactAmount")}
                      variant="outline"
                      leftIcon="calculator-outline"
                      onPress={() =>
                        setReceivedAmount(String(totalAfterDiscount))
                      }
                    />
                    
                    {/* Change Display */}
                    {+receivedAmount > totalAfterDiscount && (
                      <ThemedView style={tw`items-center mt-4 gap-2 bg-green-50 p-4 rounded-xl border border-green-200`}>
                        <ThemedView style={tw`flex-row items-center gap-2`}>
                          <Ionicons 
                            name="arrow-back-outline" 
                            size={18} 
                            color={tw.color("green-700")} 
                          />
                          <ThemedText type="body2" style={tw`text-green-700 font-medium`}>
                            {t("bills:details.change")}
                          </ThemedText>
                        </ThemedView>
                        <ThemedText style={tw`text-4xl font-bold text-green-700`}>
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
                <ThemedView style={tw`items-center mt-8 gap-4 bg-green-50 p-6 rounded-2xl border border-green-200`}>
                  <ThemedView style={tw`bg-green-500/20 p-4 rounded-full`}>
                    <Ionicons
                      name="checkmark-circle"
                      size={56}
                      color={tw.color("green-600")}
                    />
                  </ThemedView>
                  <ThemedText type="h3" style={tw`font-bold text-green-700`}>
                    {t("bills:details.billPaid")}
                  </ThemedText>
                </ThemedView>
                
                {/* Payment Details */}
                <ThemedView style={tw`mt-6 gap-4 border border-gray-200 p-5 rounded-2xl bg-white`}>
                  <ThemedText type="h4" style={tw`font-semibold mb-2`}>
                    Payment Details
                  </ThemedText>
                  <ThemedView style={tw`flex-row justify-between items-center py-2`}>
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <Ionicons 
                        name="wallet-outline" 
                        size={18} 
                        color={tw.color("gray-600")} 
                      />
                      <ThemedText type="body1" style={tw`text-gray-600`}>
                        {t("bills:details.paymentMethod")}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="body1" style={tw`font-semibold`}>
                      {bill.paymentMethod}
                    </ThemedText>
                  </ThemedView>
                  {bill.discount > 0 && (
                    <ThemedView style={tw`flex-row justify-between items-center py-2`}>
                      <ThemedView style={tw`flex-row items-center gap-2`}>
                        <Ionicons 
                          name="pricetag-outline" 
                          size={18} 
                          color={tw.color("gray-600")} 
                        />
                        <ThemedText type="body1" style={tw`text-gray-600`}>
                          {t("bills:details.discount")}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="body1" style={tw`font-semibold text-green-600`}>
                        -{formatCurrency(bill.discount)}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </>
            )}
          </ScrollView>

          {!bill.isPaid && (
            <ThemedView
              style={tw`flex-row justify-between items-center mb-4 gap-3 bg-white border-t border-gray-200 pt-4`}
            >
              <IconButton
                icon="trash-outline"
                color={tw.color("red-500")}
                onPress={() => setVisible(true)}
              />
              <ThemedView style={tw`flex-1`}>
                <Button
                  label={t("bills:details.payBill")}
                  onPress={payBill}
                  leftIcon="checkmark-circle-outline"
                  size="large"
                />
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}
