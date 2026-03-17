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
import { useState, useCallback, useEffect } from "react";
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
import { BillStatus } from "@/core/orders/models/bill.model";

export default function BillScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const setBillDiscount = useOrdersStore((state) => state.setBillDiscount);

  const [discount, setDiscount] = useState("");
  const [withDiscount, setWithDiscount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);

  const primaryColor = useThemeColor({}, "primary");
  const { mutate: removeBill } = useBills().removeBill;
  const { data: bill, isLoading, refetch } = useBills().billByIdQuery(billId);

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
  const totalAfterDiscount = bill.total - +discount;

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

  const handlePayBillPress = () => {
    if (!validateDiscount()) return;
    router.push(`/(bills)/${bill.id}/payment-method`);
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
                {formatCurrency(totalAfterDiscount)}
              </ThemedText>
              {bill.discount > 0 && (
                <ThemedText type="body2" style={tw`text-green-600`}>
                  {t("bills:details.discount")}: -{formatCurrency(bill.discount)}
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
                      <ThemedView style={tw`flex-1 flex-row items-center gap-3`}>
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

            {bill.status !== BillStatus.PAID ? (
              <>
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
                  <ThemedText type="h3" style={tw`font-bold text-green-600 mt-3`}>
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
    </>
  );
}
