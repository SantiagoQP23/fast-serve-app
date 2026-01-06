import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  View,
  RefreshControl,
  Alert,
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
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
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
            <ThemedView style={tw`  items-center gap-8`}>
              <ThemedView style={tw`gap-1 items-center`}>
                <ThemedText type="h3">
                  {t("bills:list.billNumber", { number: bill.num })}
                </ThemedText>
                <ThemedText type="body1">{date}</ThemedText>
              </ThemedView>
              <ThemedText style={tw`text-7xl `}>
                {formatCurrency(totalAfterDiscount)}
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
                  <ThemedText>{formatCurrency(detail.total)}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
            {!bill.isPaid ? (
              <>
                <TextInput
                  label={t("bills:details.discount")}
                  inputMode="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                  onBlur={validateDiscount}
                />
                <ThemedView style={tw` gap-4  mt-8`}>
                  <ThemedText type="h3">
                    {t("bills:details.paymentMethod")}
                  </ThemedText>
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
                    <ThemedText type="h3">
                      {t("bills:details.receivedAmount")}
                    </ThemedText>
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
                      label={t("bills:details.exactAmount")}
                      variant="outline"
                      onPress={() =>
                        setReceivedAmount(String(totalAfterDiscount))
                      }
                    />
                    {+receivedAmount > bill.total && (
                      <ThemedView style={tw` items-center mt-4 gap-2`}>
                        <ThemedText>{t("bills:details.change")}</ThemedText>
                        <ThemedText type="h1">
                          {formatCurrency(+receivedAmount - totalAfterDiscount)}
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
                  <ThemedText type="h2">
                    {t("bills:details.billPaid")}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={tw`mt-8 gap-4`}>
                  <ThemedText>
                    {t("bills:details.paymentMethod")}: {bill.paymentMethod}
                  </ThemedText>
                  <ThemedText>
                    {t("bills:details.discount")}:{" "}
                    {formatCurrency(bill.discount)}
                  </ThemedText>
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
                <Button
                  label={t("bills:details.payBill")}
                  onPress={payBill}
                ></Button>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}
