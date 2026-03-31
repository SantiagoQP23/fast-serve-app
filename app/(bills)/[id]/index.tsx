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
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import TextInput from "@/presentation/theme/components/text-input";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { getFormattedDate } from "@/core/common/utils/date.util";
import { useBills } from "@/presentation/orders/hooks/useBills";
import IconButton from "@/presentation/theme/components/icon-button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, i18nAlert } from "@/core/i18n/utils";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import Label from "@/presentation/theme/components/label";
import { translatePaymentMethod } from "@/core/i18n/utils";
import { BillSource, BillStatus } from "@/core/orders/models/bill.model";
import TransactionCard from "@/presentation/transactions/components/transaction-card";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import Chip from "@/presentation/theme/components/chip";

export default function BillScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const { data: bill, isLoading, refetch } = useBills().billByIdQuery(billId);

  const setBillDiscount = useOrdersStore((state) => state.setBillDiscount);

  const [discount, setDiscount] = useState(
    bill?.discount ? String(bill.discount) : "",
  );
  const [discountInput, setDiscountInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const primaryColor = useThemeColor({}, "primary");
  const { mutate: removeBill } = useBills().removeBill;
  const { mutate: updateBill } = useBills().updateBill;

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

  // Keep store in sync so the payment screen can read the current discount
  useEffect(() => {
    setBillDiscount(discount);
  }, [discount, setBillDiscount]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetch();
    } catch {
      Alert.alert(
        t("errors:order.fetchError"),
        t("errors:order.ordersFetchFailed"),
      );
    } finally {
      setRefreshing(false);
    }
  }, [refetch, t]);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="body2" style={tw`text-gray-400`}>
          {t("common:status.loading")}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!bill) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  const closeModal = () => setVisible(false);

  const date = getFormattedDate(bill.createdAt);

  const validateDiscount = () => {
    const maxDiscount = bill.subtotal * 0.1;
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

  const handlePayBillPress = () => {
    if (!validateDiscount()) return;
    router.push(`/(bills)/${bill.id}/payment-method`);
  };

  const discount5 = bill ? Math.round(bill.subtotal * 0.05 * 100) / 100 : 0;
  const discount10 = bill ? Math.round(bill.subtotal * 0.1 * 100) / 100 : 0;

  const handleOpenDiscountSheet = () => {
    setDiscountInput(discount || "");
    bottomSheetRef.current?.present();
  };

  const handleSaveDiscount = () => {
    const maxDiscount = bill.subtotal * 0.1;
    if (+discountInput > maxDiscount) {
      i18nAlert(
        t("bills:alerts.discountExceeded"),
        t("bills:alerts.maxDiscountAllowed", {
          amount: formatCurrency(maxDiscount),
        }),
      );
      return;
    }
    const updateBillDto = { id: bill.id, discount: +discountInput };
    console.log("Updating bill with discount:", updateBillDto);
    updateBill(updateBillDto, {
      onSuccess: () => {
        setDiscount(discountInput);
        bottomSheetRef.current?.dismiss();
        refetch();
      },
    });
  };

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
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

      <ScreenLayout>
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
                  {t(`bills:list.${bill.source}`, { number: bill.num })}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
                  {date}
                </ThemedText>
                {bill.status === BillStatus.PAID ? (
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
                  {formatCurrency(bill.total)}
                </ThemedText>
                {/* {bill.discount > 0 && ( */}
                {/*   <ThemedText type="body2" style={tw`text-green-600`}> */}
                {/*     {t("bills:details.discount")}: - */}
                {/*     {formatCurrency(bill.discount)} */}
                {/*   </ThemedText> */}
                {/* )} */}
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
                            {bill.source === BillSource.ORDER
                              ? detail.orderDetail?.product.name
                              : detail.product?.name}
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

              {bill.discount === 0 ? (
                <Button
                  label={t("bills:details.addDiscount")}
                  variant="secondary"
                  onPress={handleOpenDiscountSheet}
                />
              ) : (
                <ThemedView
                  style={tw`border border-gray-200 rounded-xl overflow-hidden mb-6`}
                >
                  {/* Subtotal */}
                  <ThemedView
                    style={tw`flex-row justify-between items-center px-4 py-3`}
                  >
                    <ThemedText type="body2" style={tw`text-gray-500`}>
                      {t("bills:details.subtotal")}
                    </ThemedText>
                    <ThemedText type="body1" style={tw`font-semibold`}>
                      {formatCurrency(bill.subtotal)}
                    </ThemedText>
                  </ThemedView>

                  {/* Discount row */}
                  {(bill.discount > 0 ||
                    discount ||
                    bill.status !== BillStatus.PAID) && (
                    <>
                      <ThemedView style={tw`h-px bg-gray-200`} />
                      <ThemedView
                        style={tw`flex-row justify-between items-center px-4 py-3`}
                      >
                        <ThemedView style={tw`flex-row items-center gap-2`}>
                          <ThemedText type="body2" style={tw`text-gray-500`}>
                            {t("bills:details.discount")}
                          </ThemedText>
                          {bill.status !== BillStatus.PAID && (
                            <IconButton
                              icon="pencil-outline"
                              size={16}
                              onPress={handleOpenDiscountSheet}
                              variant="text"
                            />
                          )}
                        </ThemedView>
                        <ThemedText
                          type="body1"
                          style={tw`font-semibold text-green-600`}
                        >
                          {discount
                            ? `-${formatCurrency(+discount)}`
                            : bill.discount > 0
                              ? `-${formatCurrency(bill.discount)}`
                              : "-"}
                        </ThemedText>
                      </ThemedView>
                    </>
                  )}

                  {/* Total */}
                  <ThemedView style={tw`h-px bg-gray-200`} />
                  <ThemedView
                    style={tw`flex-row justify-between items-center px-4 py-3`}
                  >
                    <ThemedText type="body1" style={tw`font-semibold`}>
                      {t("bills:details.total")}
                    </ThemedText>
                    <ThemedText type="h3" style={tw`font-bold`}>
                      {formatCurrency(bill.total)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              )}

              {bill.status === BillStatus.PAID && (
                <>
                  <ThemedView>
                    {bill.transactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </ThemedView>

                  {bill.discount > 0 && (
                    <ThemedView
                      style={tw`border border-gray-200 rounded-xl overflow-hidden`}
                    >
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
                    </ThemedView>
                  )}
                </>
              )}
            </ScrollView>

            {bill.status !== BillStatus.PAID && (
              <ThemedView
                style={tw`flex-row items-center mb-4 gap-3 border-t border-gray-200 pt-4`}
              >
                <IconButton
                  icon="trash-outline"
                  color={tw.color("red-500")}
                  onPress={() => setVisible(true)}
                />
                <ThemedView style={tw`flex-1`}>
                  <Button
                    label={t("bills:details.payBill")}
                    onPress={handlePayBillPress}
                  />
                </ThemedView>
              </ThemedView>
            )}
          </ThemedView>
        </KeyboardAvoidingView>
      </ScreenLayout>

      {/* Discount Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["45%"]}
        animationConfigs={animationConfigs}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose
      >
        <BottomSheetView style={tw`p-4 gap-4 `}>
          <ThemedView style={tw` gap-1`}>
            <ThemedText type="h3" style={tw`text-center`}>
              {t("bills:details.discount")}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-400 text-center `}>
              {t("bills:alerts.maxDiscountAllowed", {
                amount: formatCurrency(discount10),
              })}
            </ThemedText>
          </ThemedView>

          <TextInput
            inputMode="numeric"
            bottomSheet
            value={discountInput}
            onChangeText={setDiscountInput}
            placeholder="0.00"
            icon="pricetag-outline"
          />

          <ThemedView style={tw`flex-row gap-2`}>
            <Button
              label={`5%`}
              variant={
                discountInput === String(discount5) ? "primary" : "outline"
              }
              onPress={() => setDiscountInput(String(discount5))}
            />
            <Button
              label={`10%`}
              variant={
                discountInput === String(discount10) ? "primary" : "outline"
              }
              onPress={() => setDiscountInput(String(discount10))}
            />
          </ThemedView>

          <Button
            label={t("common:actions.save")}
            onPress={handleSaveDiscount}
            disabled={
              discountInput === "" && discountInput === String(discount)
            }
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
