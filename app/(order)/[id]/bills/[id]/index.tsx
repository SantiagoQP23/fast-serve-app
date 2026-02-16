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
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";

export default function BillScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
  const bill = useOrdersStore((state) => state.activeBill);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardCommission, setCardCommission] = useState("2.4");
  const [transferNote, setTransferNote] = useState("");

  const [discount, setDiscount] = useState("");
  const [withDiscount, setWithDiscount] = useState(false);

  const order = useOrdersStore((state) => state.activeOrder);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = useThemeColor({}, "primary");

  const [visible, setVisible] = useState(false);
  const cashBottomSheetRef = useRef<BottomSheetModal>(null);
  const creditBottomSheetRef = useRef<BottomSheetModal>(null);
  const transferBottomSheetRef = useRef<BottomSheetModal>(null);
  const cashSnapPoints = useMemo(() => ["60%", "70%"], []);
  const creditSnapPoints = useMemo(() => ["45%"], []);
  const transferSnapPoints = useMemo(() => ["35%"], []);
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
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    100,
  ];
  const commissionOptions = [2.4, 4.5, 5.4];
  const date = getFormattedDate(bill.createdAt);

  useEffect(() => {
    if (paymentMethod === PaymentMethodE.CREDIT_CARD) {
      creditBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    }
    if (paymentMethod === PaymentMethodE.TRANSFER) {
      transferBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      creditBottomSheetRef.current?.dismiss();
    }
  }, [cardCommission, paymentMethod]);

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

    if (paymentMethod === PaymentMethodE.CASH) {
      if (+receivedAmount < totalAfterDiscount) {
        alert(t("bills:alerts.insufficientAmount"));
        return;
      }
    }

    const amountToRegister = getReceivedAmountValue();

    const data: UpdateBillDto = {
      id: bill.id,
      discount: +discount,
      paymentMethod,
      receivedAmount: amountToRegister,
      isPaid: true,
      comments:
        paymentMethod === PaymentMethodE.TRANSFER && transferNote
          ? transferNote
          : "",
      // cashRegisterId: activeCashRegister!.id,
    };

    updateBill(data, {
      onSuccess: (order) => {
        console.log("Updating bill with data:", data);
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
  const parsedCommission = cardCommission ? parseFloat(cardCommission) : 0;
  const commissionRate = Number.isNaN(parsedCommission)
    ? 0
    : parsedCommission / 100;
  const commissionAmount = totalAfterDiscount * commissionRate;
  const totalWithCommission = totalAfterDiscount + commissionAmount;

  const getReceivedAmountValue = () => {
    if (paymentMethod === PaymentMethodE.CASH) {
      return +receivedAmount;
    }
    if (paymentMethod === PaymentMethodE.CREDIT_CARD) {
      return totalWithCommission;
    }
    return totalAfterDiscount;
  };

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

  const handlePaymentMethodPress = (methodValue: PaymentMethod["value"]) => {
    setPaymentMethod(methodValue);

    if (methodValue === PaymentMethodE.CASH) {
      cashBottomSheetRef.current?.present();
      creditBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    } else if (methodValue === PaymentMethodE.CREDIT_CARD) {
      creditBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    } else if (methodValue === PaymentMethodE.TRANSFER) {
      transferBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      creditBottomSheetRef.current?.dismiss();
    } else {
      cashBottomSheetRef.current?.dismiss();
      creditBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    }
  };

  return (
    <>
      <BottomSheetModal
        ref={transferBottomSheetRef}
        index={0}
        snapPoints={transferSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <BottomSheetView style={tw`p-6 gap-4`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h4">{t("bills:details.transferNote")}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalAmount")}:{" "}
              {formatCurrency(totalAfterDiscount)}
            </ThemedText>
          </ThemedView>
          <TextInput
            value={transferNote}
            onChangeText={setTransferNote}
            placeholder={t("bills:details.transferNotePlaceholder")}
            bottomSheet
          />
          <Button label={t("bills:details.payBill")} onPress={payBill} />
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={creditBottomSheetRef}
        index={0}
        snapPoints={creditSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <BottomSheetView style={tw`p-6 gap-4`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h4">{t("bills:details.commission")}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalAmount")}:{" "}
              {formatCurrency(totalAfterDiscount)}
            </ThemedText>
          </ThemedView>

          <TextInput
            value={cardCommission}
            onChangeText={setCardCommission}
            inputMode="decimal"
            placeholder="0.0"
            bottomSheet
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 mt-1`}
            nestedScrollEnabled
          >
            {commissionOptions.map((option) => (
              <Button
                key={option}
                label={`${option}%`}
                variant={
                  cardCommission === option.toString() ? "primary" : "outline"
                }
                size="small"
                onPress={() => setCardCommission(option.toString())}
              />
            ))}
          </ScrollView>

          <ThemedView
            style={tw`p-4 rounded-xl border border-gray-200 bg-gray-50 gap-1`}
          >
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalToPay")}
            </ThemedText>
            <ThemedText style={tw`text-3xl font-bold`}>
              {formatCurrency(totalWithCommission)}
            </ThemedText>
          </ThemedView>

          <Button label={t("bills:details.payBill")} onPress={payBill} />
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={cashBottomSheetRef}
        index={0}
        snapPoints={cashSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <ThemedView style={tw`p-4 gap-4 mb-8`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h4">
              {t("bills:details.receivedAmount")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalAmount")}:{" "}
              {formatCurrency(totalAfterDiscount)}
            </ThemedText>
          </ThemedView>

          <TextInput
            value={receivedAmount}
            onChangeText={setReceivedAmount}
            inputMode="numeric"
            placeholder="0.00"
            bottomSheet
          />

          <BottomSheetScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`gap-2 mt-1`}
            nestedScrollEnabled
          >
            {moneyReceivedOptions
              .filter((value) => value >= totalAfterDiscount)
              .map((amount) => (
                <Button
                  key={amount}
                  label={`$${amount}`}
                  variant={amount === +receivedAmount ? "primary" : "outline"}
                  size="small"
                  onPress={() => setReceivedAmount(amount.toString())}
                />
              ))}
          </BottomSheetScrollView>

          <Button
            label={t("bills:details.exactAmount")}
            variant="outline"
            onPress={() => setReceivedAmount(String(totalAfterDiscount))}
          />

          {+receivedAmount > totalAfterDiscount && (
            <ThemedView
              style={tw`mt-2 p-4 rounded-xl border border-green-200 items-center`}
            >
              <ThemedText type="caption" style={tw`text-green-700 mb-1`}>
                {t("bills:details.change")}
              </ThemedText>
              <ThemedText style={tw`text-3xl font-bold text-green-700`}>
                {formatCurrency(+receivedAmount - totalAfterDiscount)}
              </ThemedText>
            </ThemedView>
          )}

          <Button
            label={t("bills:details.payBill")}
            onPress={payBill}
            disabled={+receivedAmount < totalAfterDiscount}
          />
        </ThemedView>
      </BottomSheetModal>
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
                {!withDiscount && (
                  <Button
                    label={t("bills:details.addDiscount")}
                    variant="text"
                    onPress={() => setWithDiscount((prev) => !prev)}
                  />
                )}
                {withDiscount && (
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
                )}

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
                        onPress={() => handlePaymentMethodPress(method.value)}
                      />
                    ))}
                  </ScrollView>
                </ThemedView>

                {/* Cash Payment Section */}
                {paymentMethod === PaymentMethodE.CASH && (
                  <Button
                    label={t("bills:details.receivedAmount")}
                    variant="secondary"
                    onPress={() => cashBottomSheetRef.current?.present()}
                  />
                )}
                {paymentMethod === PaymentMethodE.CREDIT_CARD && (
                  <Button
                    label={t("bills:details.commission")}
                    variant="secondary"
                    onPress={() => creditBottomSheetRef.current?.present()}
                  />
                )}
                {paymentMethod === PaymentMethodE.TRANSFER && (
                  <Button
                    label={t("bills:details.transferNote")}
                    variant="secondary"
                    onPress={() => transferBottomSheetRef.current?.present()}
                  />
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
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}
