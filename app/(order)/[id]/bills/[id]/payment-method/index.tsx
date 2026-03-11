import { ScrollView, Alert } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import PaymentMethodCard, {
  PaymentMethod,
} from "@/presentation/orders/components/payment-method-card";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { UpdateBillDto } from "@/core/orders/dto/update-bill.dto";
import { PaymentMethod as PaymentMethodE } from "@/core/orders/enums/payment-method";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

export default function PaymentMethodScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
  const bill = useOrdersStore((state) => state.activeBill);
  const discount = useOrdersStore((state) => state.billDiscount);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [cardCommission, setCardCommission] = useState("2.4");
  const [transferNote, setTransferNote] = useState("");

  const cashBottomSheetRef = useRef<BottomSheetModal>(null);
  const creditBottomSheetRef = useRef<BottomSheetModal>(null);
  const transferBottomSheetRef = useRef<BottomSheetModal>(null);
  const cashSnapPoints = useMemo(() => ["70%"], []);
  const creditSnapPoints = useMemo(() => ["45%"], []);
  const transferSnapPoints = useMemo(() => ["35%"], []);

  const { mutate: updateBill } = useBills().updateBill;

  const totalAfterDiscount = bill ? bill.total - +discount : 0;
  const parsedCommission = cardCommission ? parseFloat(cardCommission) : 0;
  const commissionRate = Number.isNaN(parsedCommission)
    ? 0
    : parsedCommission / 100;
  const commissionAmount = totalAfterDiscount * commissionRate;
  const totalWithCommission = totalAfterDiscount + commissionAmount;

  const moneyReceivedOptions = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170,
    175, 180, 185, 190, 195, 200,
  ];
  const commissionOptions = [2.4, 4.5, 5.4];

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

  if (!bill) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  const getReceivedAmountValue = () => {
    if (paymentMethod === PaymentMethodE.CASH) {
      return +receivedAmount;
    }
    if (paymentMethod === PaymentMethodE.CREDIT_CARD) {
      return totalWithCommission;
    }
    return totalAfterDiscount;
  };

  const payBill = () => {
    if (!paymentMethod) {
      Alert.alert(
        t("errors:bill.selectPaymentMethod"),
        t("errors:bill.paymentMethodRequired"),
      );
      return;
    }

    if (paymentMethod === PaymentMethodE.CASH) {
      if (+receivedAmount < totalAfterDiscount) {
        Alert.alert(t("bills:alerts.insufficientAmount"));
        return;
      }
    }

    const data: UpdateBillDto = {
      id: bill.id,
      discount: +discount,
      paymentMethod,
      receivedAmount: getReceivedAmountValue(),
      isPaid: true,
      comments:
        paymentMethod === PaymentMethodE.TRANSFER && transferNote
          ? transferNote
          : "",
    };

    updateBill(data, {
      onSuccess: () => {
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
        <BottomSheetView style={tw`p-4 gap-4 mb-8`}>
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
            icon="cash-outline"
          />

          <ScrollView
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
          </ScrollView>

          <Button
            label={t("bills:details.exactAmount")}
            variant="outline"
            onPress={() => setReceivedAmount(String(totalAfterDiscount))}
          />

          {+receivedAmount > totalAfterDiscount && (
            <ThemedView
              style={tw`mt-2 p-4 rounded-xl border border-light-border items-center`}
            >
              <ThemedText type="caption" style={tw`mb-1`}>
                {t("bills:details.change")}
              </ThemedText>
              <ThemedText type="h1">
                {formatCurrency(+receivedAmount - totalAfterDiscount)}
              </ThemedText>
            </ThemedView>
          )}

          <Button
            label={t("bills:details.payBill")}
            onPress={payBill}
            disabled={+receivedAmount < totalAfterDiscount}
          />
        </BottomSheetView>
      </BottomSheetModal>

      <ThemedView style={tw`flex-1 px-4 pt-6`}>
        {/* Total display */}
        <ThemedView style={tw`items-center mb-8`}>
          <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
            {t("bills:details.totalAmount")}
          </ThemedText>
          <ThemedText style={tw`text-5xl font-bold`}>
            {formatCurrency(totalAfterDiscount)}
          </ThemedText>
        </ThemedView>

        {/* Payment method selection */}
        <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
          {t("bills:details.paymentMethod")}
        </ThemedText>
        <ThemedView style={tw`gap-3`}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              paymentMethod={method}
              key={method.value}
              variant="vertical"
              active={paymentMethod === method.value}
              onPress={() => handlePaymentMethodPress(method.value)}
            />
          ))}
        </ThemedView>

        {/* Open bottom sheet buttons */}
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
      </ThemedView>
    </>
  );
}
