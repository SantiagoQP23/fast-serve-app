import { ScrollView, Image, Pressable } from "react-native";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import Button from "@/presentation/theme/components/button";
import PaymentMethodCard, {
  getPaymentMethodIcon,
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
import Icon from "@/presentation/theme/components/icon";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Chip from "@/presentation/theme/components/chip";
import { usePaymentStore } from "@/presentation/payment/store/usePaymentStore";
import { roundTo } from "@/core/common/utils/format.util";
import {
  applyCommission,
  getBillAmountDue,
  getCashTenderSuggestions,
  isSameAmount,
  parseAmount,
} from "@/core/orders/utils/bill-payment.util";
import BillLoadState from "@/presentation/orders/components/bill-load-state";
import * as ImagePicker from "expo-image-picker";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import Switch from "@/presentation/theme/components/switch";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";

export default function PaymentMethodScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const {
    data: bill,
    isLoading: isLoadingBill,
    error: billError,
    refetch: refetchBill,
  } = useBills().billByIdQuery(billId);

  // Another device may have charged part of this bill since it was opened.
  useFocusEffect(
    useCallback(() => {
      refetchBill();
    }, [refetchBill]),
  );

  const setSelectedPaymentMethod = useOrdersStore(
    (state) => state.setSelectedPaymentMethod,
  );
  const setBillReceivedAmount = useOrdersStore(
    (state) => state.setBillReceivedAmount,
  );
  const setBillTransferNote = useOrdersStore(
    (state) => state.setBillTransferNote,
  );
  const setBillRequestApproval = useOrdersStore(
    (state) => state.setBillRequestApproval,
  );
  const setBillAmount = useOrdersStore((state) => state.setBillAmount);
  const setPendingProofImage = useOrdersStore(
    (state) => state.setPendingProofImage,
  );

  const { paymentMethods } = usePaymentMethodsStore();
  // Keeps the payment methods store loaded for this screen.
  usePaymentMethods();
  const activePaymentMethods = paymentMethods.filter((m) => m.isActive);
  const { generateBillPaymentIdempotencyKey } = usePaymentStore();
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);

  useEffect(() => {
    generateBillPaymentIdempotencyKey();
  }, [generateBillPaymentIdempotencyKey]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [receivedAmount, setReceivedAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [selectedProofImage, setSelectedProofImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pendingNavigationMethod, setPendingNavigationMethod] =
    useState<PaymentMethod | null>(null);

  // What's left to charge, always from the latest bill. Until the cashier
  // types their own amount, the field follows it.
  const amountDue = bill ? getBillAmountDue(bill) : 0;
  const [payAmountInput, setPayAmountInput] = useState<string | null>(null);
  const payAmountText =
    payAmountInput ?? (amountDue > 0 ? amountDue.toFixed(2) : "");
  const payAmount = parseAmount(payAmountText);

  const amountError = !bill
    ? undefined
    : !(payAmount > 0)
      ? t("errors:validation.amountMustBeGreaterThanZero")
      : payAmount > amountDue && !isSameAmount(payAmount, amountDue)
        ? t("errors:validation.amountExceeds", {
            amount: formatCurrency(amountDue),
          })
        : undefined;

  // The account screen charges whatever is in the store, so only a valid
  // amount ever lands there.
  useEffect(() => {
    setBillAmount(amountError ? "" : payAmount.toFixed(2));
  }, [amountError, payAmount, setBillAmount]);

  const pct25 = roundTo(amountDue * 0.25, 2);
  const pct50 = roundTo(amountDue * 0.5, 2);
  const pct75 = roundTo(amountDue * 0.75, 2);

  const cashBottomSheetRef = useRef<BottomSheetMethods>(null);
  const cardBottomSheetRef = useRef<BottomSheetMethods>(null);
  const transferBottomSheetRef = useRef<BottomSheetMethods>(null);

  const totalWithCommission = applyCommission(
    payAmount || 0,
    selectedMethod?.commissionPercentage ?? 0,
  );
  const received = parseAmount(receivedAmount);
  const isReceivedEnough =
    received >= payAmount || isSameAmount(received, payAmount);

  const tenderSuggestions = getCashTenderSuggestions(payAmount);
  // "$25", not "$25.00": these read as notes, not prices.
  const formatTender = (value: number) =>
    formatCurrency(value).replace(/\.00$/, "");

  if (!bill) {
    return (
      <BillLoadState
        isLoading={isLoadingBill}
        error={billError}
        onRetry={refetchBill}
      />
    );
  }

  if (amountDue <= 0) {
    return (
      <BillLoadState
        icon="circle-check"
        title={t("bills:payment.alreadyPaidTitle")}
        description={t("bills:payment.alreadyPaidDescription")}
      />
    );
  }

  if (activePaymentMethods.length === 0) {
    return (
      <ThemedView style={tw`flex-1 items-center justify-center px-8 gap-4`}>
        <Icon name="credit-card" size={56} color={tw.color("gray-400")} />
        <ThemedView style={tw`items-center gap-1`}>
          <ThemedText type="h3" style={tw`text-center`}>
            {t("bills:payment.noMethodsTitle")}
          </ThemedText>
          <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
            {t("bills:payment.noMethodsDescription")}
          </ThemedText>
        </ThemedView>
        <Button
          label={t("bills:payment.goToSettings")}
          leftIcon="store"
          variant="outline"
          onPress={() => router.push("/(profile)/restaurant")}
        />
      </ThemedView>
    );
  }

  const navigateToAccount = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    router.push(`/(bills)/${bill.id}/payment-method/account`);
  };

  // Fires once a bottom sheet's native dismiss animation has actually completed.
  // Navigating only here (instead of right after calling `dismiss()`) avoids tearing
  // down the native sheet view while its `hide()` call is still in flight, which
  // raises an unhandled "No handler registered for AsyncFunction 'hide'" rejection.
  const handleSheetDismissed = () => {
    if (!pendingNavigationMethod) return;
    const method = pendingNavigationMethod;
    setPendingNavigationMethod(null);
    navigateToAccount(method);
  };

  const continueCashWith = (receivedValue: number) => {
    if (!selectedMethod) return;
    setBillReceivedAmount(receivedValue.toFixed(2));
    setPendingNavigationMethod(selectedMethod);
    cashBottomSheetRef.current?.dismiss();
  };

  const handleContinueCash = () => {
    if (!isReceivedEnough) {
      toast.error(t("bills:alerts.insufficientAmount"));
      return;
    }
    continueCashWith(received);
  };

  const handleContinueCard = () => {
    if (!selectedMethod) return;
    setPendingNavigationMethod(selectedMethod);
    cardBottomSheetRef.current?.dismiss();
  };

  const pickProofImage = async (source: "camera" | "gallery") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      toast.error(t("errors:general.cameraPermissionRequired"));
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [9, 16],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [9, 16],
            quality: 0.8,
          });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedProofImage(result.assets[0]);
    }
  };

  const removeSelectedImage = () => {
    setSelectedProofImage(null);
  };

  const handleContinueTransfer = () => {
    if (!selectedMethod) return;
    setBillTransferNote(transferNote);
    // Only admin-level roles can mark a transfer as already confirmed; it then
    // skips approval, so no proof image is attached.
    const skipApproval = isAdmin && alreadyConfirmed;
    setBillRequestApproval(!skipApproval);
    if (selectedProofImage && !skipApproval) {
      setPendingProofImage({
        uri: selectedProofImage.uri,
        fileName: selectedProofImage.fileName || "proof.jpg",
        mimeType: selectedProofImage.mimeType || "image/jpeg",
      });
    }
    setPendingNavigationMethod(selectedMethod);
    transferBottomSheetRef.current?.dismiss();
  };

  const handlePaymentMethodPress = (method: PaymentMethod) => {
    // The reason is already shown under the amount; just signal the tap.
    if (amountError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSelectedMethod(method);
    setReceivedAmount("");
    setTransferNote("");
    setAlreadyConfirmed(false);

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
      <ThemedBottomSheetModal
        ref={transferBottomSheetRef}
        index={0}
        enablePanDownToClose
        onDismiss={handleSheetDismissed}
      >
        <BottomSheetView style={tw`p-6 gap-4 bg-background`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h3">{selectedMethod?.name}</ThemedText>
            <ThemedText type="body1" style={tw`text-gray-500`}>
              {formatCurrency(payAmount)}
            </ThemedText>
          </ThemedView>
          {/* <TextInput */}
          {/*   value={transferNote} */}
          {/*   onChangeText={setTransferNote} */}
          {/*   placeholder={t("bills:details.transferNotePlaceholder")} */}
          {/*   bottomSheet */}
          {/* /> */}

          {isAdmin && (
            <ThemedView style={tw`gap-1`}>
              <Switch
                value={alreadyConfirmed}
                onValueChange={setAlreadyConfirmed}
                label={t("bills:proofUpload.alreadyConfirmed")}
              />
              {alreadyConfirmed && (
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("bills:proofUpload.autoApproveHint")}
                </ThemedText>
              )}
            </ThemedView>
          )}

          {/* Proof image upload section — not needed once confirmed */}
          {!(isAdmin && alreadyConfirmed) && (
            <ThemedView style={tw`gap-3`}>
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {t("bills:proofUpload.uploadTitle")}
              </ThemedText>

              {selectedProofImage ? (
                <ThemedView style={tw`gap-3`}>
                  <ThemedView
                    style={tw`rounded-md border border-gray-200 overflow-hidden`}
                  >
                    <Image
                      source={{ uri: selectedProofImage.uri }}
                      style={tw`w-full h-32`}
                      resizeMode="cover"
                    />
                  </ThemedView>
                  <Button
                    label={t("common:actions.change")}
                    variant="outline"
                    size="small"
                    onPress={removeSelectedImage}
                  />
                </ThemedView>
              ) : (
                <ThemedView style={tw`flex-row gap-3`}>
                  <Pressable
                    onPress={() => pickProofImage("gallery")}
                    style={({ pressed }) => [
                      tw`flex-1 items-center justify-center p-4 rounded-md border-2 border-dashed border-border  bg-surface gap-2`,
                      pressed && tw`opacity-70 bg-gray-100`,
                    ]}
                  >
                    <Icon
                      name="images"
                      size={24}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText
                      type="small"
                      style={tw`text-gray-500 text-center`}
                    >
                      {t("bills:proofUpload.fromGallery")}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => pickProofImage("camera")}
                    style={({ pressed }) => [
                      tw`flex-1 items-center justify-center p-4 rounded-md border-2 border-dashed border-border  bg-surface gap-2`,
                      pressed && tw`opacity-70 bg-gray-100`,
                    ]}
                  >
                    <Icon
                      name="camera"
                      size={24}
                      color={tw.color("gray-400")}
                    />
                    <ThemedText
                      type="small"
                      style={tw`text-gray-500 text-center`}
                    >
                      {t("bills:proofUpload.fromCamera")}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            </ThemedView>
          )}

          {/* <ThemedView */}
          {/*   style={tw`flex-row items-center gap-2 p-3 rounded-md bg-blue-50`} */}
          {/* > */}
          {/*   <Icon */}
          {/*     name="information-circle-outline" */}
          {/*     size={18} */}
          {/*     color={tw.color("blue-500")} */}
          {/*   /> */}
          {/*   <ThemedText type="small" style={tw`text-blue-600 flex-1`}> */}
          {/*     {t("bills:details.transferProofNote")} */}
          {/*   </ThemedText> */}
          {/* </ThemedView> */}
          <Button
            label={t("common:actions.continue")}
            onPress={handleContinueTransfer}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      {/* Card bottom sheet */}
      <ThemedBottomSheetModal
        ref={cardBottomSheetRef}
        index={0}
        enablePanDownToClose
        onDismiss={handleSheetDismissed}
      >
        <BottomSheetView style={tw`p-6 gap-4 bg-background`}>
          <ThemedView style={tw`gap-1 items-center`}>
            <ThemedText type="h3">{selectedMethod?.name}</ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.amountToCharge")}: {formatCurrency(payAmount)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw` rounded-md  gap-1 items-center mb-4`}>
            {(selectedMethod?.commissionPercentage ?? 0) > 0 && (
              <ThemedText type="body1">
                {t("bills:details.plusCommission", {
                  percentage: selectedMethod?.commissionPercentage,
                })}
              </ThemedText>
            )}
            <ThemedText type="body2" style={tw`text-gray-500 mt-2`}>
              {t("bills:details.totalToPay")}
            </ThemedText>
            <ThemedText type="h1">
              {formatCurrency(totalWithCommission)}
            </ThemedText>
          </ThemedView>

          <Button
            label={t("common:actions.continue")}
            onPress={handleContinueCard}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      {/* Cash bottom sheet */}
      <ThemedBottomSheetModal
        ref={cashBottomSheetRef}
        index={0}
        enablePanDownToClose
        onDismiss={handleSheetDismissed}
      >
        <BottomSheetView style={tw`p-4 gap-4 mb-8 bg-background`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h3">
              {t("bills:details.receivedAmount")}
            </ThemedText>
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.amountToCharge")}: {formatCurrency(payAmount)}
            </ThemedText>
          </ThemedView>

          <TextInput
            value={receivedAmount}
            onChangeText={setReceivedAmount}
            inputMode="decimal"
            placeholder="0.00"
            bottomSheet
            icon="banknote"
          />

          {/* Exact pays without change, so it goes straight on. The others
              fill in what the customer handed over and show the change. */}
          <ThemedView style={tw`flex-row flex-wrap gap-2`}>
            <Chip
              variant="assist"
              icon="banknote"
              label={t("bills:details.exactAmount")}
              onPress={() => continueCashWith(payAmount)}
            />
            {tenderSuggestions.map((tender) => (
              <Chip
                key={tender}
                label={formatTender(tender)}
                selected={isSameAmount(received, tender)}
                onPress={() => setReceivedAmount(tender.toFixed(2))}
              />
            ))}
          </ThemedView>

          {received > payAmount && !isSameAmount(received, payAmount) && (
            <ThemedView style={tw`mt-2 p-4  items-center`}>
              <ThemedText type="caption" style={tw`mb-1`}>
                {t("bills:details.change")}
              </ThemedText>
              <ThemedText type="h1">
                {formatCurrency(received - payAmount)}
              </ThemedText>
            </ThemedView>
          )}

          <Button
            label={t("common:actions.continue")}
            onPress={handleContinueCash}
            disabled={!isReceivedEnough}
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>

      <ScreenLayout style={tw`flex-1 px-4 pt-6`}>
        {/* Amount to Pay */}
        <ThemedView style={tw`items-center mb-4`}>
          <ThemedText type="caption" style={tw`text-text mb-2`}>
            {t("bills:details.amountToCharge")}
          </ThemedText>
          <TextInput
            inputMode="decimal"
            value={payAmountText}
            onChangeText={setPayAmountInput}
            placeholder="0.00"
            style={tw`text-5xl text-center`}
            containerStyle={tw`w-full bg-transparent border-0`}
            error={amountError}
          />
        </ThemedView>

        {/* Percentage quick-select */}
        <ThemedView style={tw`flex-row gap-2 mb-8 justify-center`}>
          {[
            { label: "25%", amount: pct25 },
            { label: "50%", amount: pct50 },
            { label: "75%", amount: pct75 },
            { label: t("bills:details.total"), amount: amountDue },
          ].map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={isSameAmount(payAmount, option.amount)}
              onPress={() => setPayAmountInput(option.amount.toFixed(2))}
            />
          ))}
        </ThemedView>

        {/* Payment method list */}
        <ThemedText type="body2" style={tw` mb-3`}>
          {t("bills:details.paymentMethod")}
        </ThemedText>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`gap-4 pb-4`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activePaymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={{
                name: method.name,
                value: String(method.id),
                icon: getPaymentMethodIcon(method.type),
              }}
              variant="vertical"
              active={selectedMethod?.id === method.id}
              onPress={() => handlePaymentMethodPress(method)}
            />
          ))}
        </ScrollView>
      </ScreenLayout>
    </>
  );
}
