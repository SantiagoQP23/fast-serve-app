import { ScrollView, Alert } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useNavigation } from "expo-router";
import { ActivityIndicator } from "react-native";
import IconButton from "@/presentation/theme/components/icon-button";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import Button from "@/presentation/theme/components/button";
import PaymentMethodCard, {
  PaymentMethod as PaymentMethodCardProps,
} from "@/presentation/orders/components/payment-method-card";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import {
  PaymentMethod,
  PaymentMethodCategory,
} from "@/core/restaurant/models/payment-method.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

const iconForType = (
  type: PaymentMethodCategory,
): PaymentMethodCardProps["icon"] => {
  switch (type) {
    case PaymentMethodCategory.CASH:
      return "cash-outline";
    case PaymentMethodCategory.CARD:
      return "card-outline";
    case PaymentMethodCategory.TRANSFER:
      return "wallet-outline";
    case PaymentMethodCategory.DIGITAL_WALLET:
      return "phone-portrait-outline";
    default:
      return "ellipsis-horizontal-circle-outline";
  }
};

export default function PaymentMethodScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
  const navigation = useNavigation();

  const bill = useOrdersStore((state) => state.activeBill);
  const order = useOrdersStore((state) => state.activeOrder);
  const discount = useOrdersStore((state) => state.billDiscount);
  const setSelectedPaymentMethod = useOrdersStore(
    (state) => state.setSelectedPaymentMethod,
  );
  const setBillReceivedAmount = useOrdersStore(
    (state) => state.setBillReceivedAmount,
  );
  const setBillTransferNote = useOrdersStore(
    (state) => state.setBillTransferNote,
  );

  const { paymentMethods } = usePaymentMethodsStore();
  const { paymentMethodsQuery } = usePaymentMethods();
  const { refetch, isRefetching } = paymentMethodsQuery;
  const activePaymentMethods = paymentMethods.filter((m) => m.isActive);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isRefetching ? (
          <ActivityIndicator size="small" style={{ marginRight: 4 }} />
        ) : (
          <IconButton icon="refresh-outline" onPress={() => refetch()} />
        ),
    });
  }, [isRefetching, refetch, navigation]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [receivedAmount, setReceivedAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const cashBottomSheetRef = useRef<BottomSheetModal>(null);
  const cardBottomSheetRef = useRef<BottomSheetModal>(null);
  const transferBottomSheetRef = useRef<BottomSheetModal>(null);
  const cashSnapPoints = useMemo(() => ["70%"], []);
  const cardSnapPoints = useMemo(() => ["40%"], []);
  const transferSnapPoints = useMemo(() => ["35%"], []);

  const totalAfterDiscount = bill ? bill.total - +discount : 0;
  const commissionRate = selectedMethod
    ? selectedMethod.commissionPercentage / 100
    : 0;
  const totalWithCommission = totalAfterDiscount * (1 + commissionRate);

  const moneyReceivedOptions = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170,
    175, 180, 185, 190, 195, 200,
  ];

  if (!bill || !order) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  if (activePaymentMethods.length === 0) {
    return (
      <ThemedView style={tw`flex-1 items-center justify-center px-8 gap-4`}>
        <Ionicons name="card-outline" size={56} color={tw.color("gray-400")} />
        <ThemedView style={tw`items-center gap-1`}>
          <ThemedText type="h3" style={tw`text-center`}>
            No payment methods available
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
            Load payment methods from the Restaurant settings before processing
            a payment.
          </ThemedText>
        </ThemedView>
        <Button
          label="Go to Restaurant settings"
          leftIcon="storefront-outline"
          variant="outline"
          onPress={() => router.push("/(profile)/restaurant")}
        />
      </ThemedView>
    );
  }

  const navigateToAccount = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setTimeout(() => {
      router.push(
        `/(order)/${order.id}/bills/${bill.id}/payment-method/account`,
      );
    }, 100);
  };

  const handleContinueCash = () => {
    if (!selectedMethod) return;
    if (+receivedAmount < totalAfterDiscount) {
      Alert.alert(t("bills:alerts.insufficientAmount"));
      return;
    }
    setBillReceivedAmount(receivedAmount);
    cashBottomSheetRef.current?.dismiss();
    navigateToAccount(selectedMethod);
  };

  const handleContinueCard = () => {
    if (!selectedMethod) return;
    cardBottomSheetRef.current?.dismiss();
    navigateToAccount(selectedMethod);
  };

  const handleContinueTransfer = () => {
    if (!selectedMethod) return;
    setBillTransferNote(transferNote);
    transferBottomSheetRef.current?.dismiss();
    navigateToAccount(selectedMethod);
  };

  const handlePaymentMethodPress = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setReceivedAmount("");
    setTransferNote("");

    if (method.type === PaymentMethodCategory.CASH) {
      cashBottomSheetRef.current?.present();
      cardBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    } else if (method.type === PaymentMethodCategory.CARD) {
      cardBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
    } else if (method.type === PaymentMethodCategory.TRANSFER) {
      transferBottomSheetRef.current?.present();
      cashBottomSheetRef.current?.dismiss();
      cardBottomSheetRef.current?.dismiss();
    } else {
      // DIGITAL_WALLET / OTHER — no extra input, go straight to account
      cashBottomSheetRef.current?.dismiss();
      cardBottomSheetRef.current?.dismiss();
      transferBottomSheetRef.current?.dismiss();
      navigateToAccount(method);
    }
  };

  return (
    <>
      {/* Transfer bottom sheet */}
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
          <Button
            label={t("common:actions.continue")}
            onPress={handleContinueTransfer}
          />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Card bottom sheet */}
      <BottomSheetModal
        ref={cardBottomSheetRef}
        index={0}
        snapPoints={cardSnapPoints}
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

          <ThemedView
            style={tw`p-4 rounded-xl border border-gray-200 bg-gray-50 gap-1`}
          >
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {selectedMethod?.commissionPercentage ?? 0}%{" "}
              {t("bills:details.commission").toLowerCase()}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalToPay")}
            </ThemedText>
            <ThemedText style={tw`text-3xl font-bold`}>
              {formatCurrency(totalWithCommission)}
            </ThemedText>
          </ThemedView>

          <Button
            label={t("common:actions.continue")}
            onPress={handleContinueCard}
          />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Cash bottom sheet */}
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
            label={t("common:actions.continue")}
            onPress={handleContinueCash}
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

        {/* Payment method list */}
        <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
          {t("bills:details.paymentMethod")}
        </ThemedText>
        <ThemedView style={tw`gap-3`}>
          {activePaymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={{
                name: method.name,
                value: String(method.id),
                icon: iconForType(method.type),
              }}
              variant="vertical"
              active={selectedMethod?.id === method.id}
              onPress={() => handlePaymentMethodPress(method)}
            />
          ))}
        </ThemedView>
      </ThemedView>
    </>
  );
}
