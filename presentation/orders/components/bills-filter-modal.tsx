import React, { useState } from "react";
import { Modal, View, Pressable, ScrollView } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import { translatePaymentMethod, getPaymentMethodIcon } from "@/core/i18n/utils";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";

interface BillsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: BillListFiltersDto) => void;
  initialFilters?: BillListFiltersDto;
}

type PaymentStatusFilter = "all" | "paid" | "unpaid";

export default function BillsFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: BillsFilterModalProps) {
  const { t } = useTranslation(["bills", "common"]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">(
    initialFilters?.paymentMethod || "all"
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>(
    initialFilters?.isPaid === undefined
      ? "all"
      : initialFilters.isPaid
      ? "paid"
      : "unpaid"
  );

  const handleReset = () => {
    setPaymentMethod("all");
    setPaymentStatus("all");
  };

  const handleApply = () => {
    const filters: BillListFiltersDto = {};

    if (paymentMethod !== "all") {
      filters.paymentMethod = paymentMethod as PaymentMethod;
    }

    if (paymentStatus === "paid") {
      filters.isPaid = true;
    } else if (paymentStatus === "unpaid") {
      filters.isPaid = false;
    }

    onApply(filters);
    onClose();
  };

  const paymentMethods: Array<PaymentMethod | "all"> = [
    "all",
    PaymentMethod.CASH,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.TRANSFER,
  ];

  const paymentStatuses: PaymentStatusFilter[] = ["all", "paid", "unpaid"];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={tw`flex-1 bg-black/50 items-center justify-center`}
        onPress={onClose}
      >
        {/* Modal content */}
        <Pressable
          style={tw`bg-white rounded-2xl w-11/12 max-w-md shadow-lg`}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            style={tw`max-h-160`}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <ThemedView
              style={tw`flex-row items-center justify-between p-5 border-b border-gray-200`}
            >
              <ThemedText type="h3">{t("bills:filters.title")}</ThemedText>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color={tw.color("gray-600")} />
              </Pressable>
            </ThemedView>

            {/* Filters */}
            <ThemedView style={tw`p-5 gap-6`}>
              {/* Payment Method Filter */}
              <ThemedView style={tw`gap-3`}>
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("bills:filters.paymentMethod")}
                </ThemedText>
                <ThemedView style={tw`gap-2`}>
                  {paymentMethods.map((method) => (
                    <Pressable
                      key={method}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <ThemedView
                        style={tw`flex-row items-center justify-between p-3 rounded-xl border ${
                          paymentMethod === method
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <ThemedView style={tw`flex-row items-center gap-3`}>
                          <Ionicons
                            name={
                              method === "all"
                                ? "apps-outline"
                                : getPaymentMethodIcon(method as PaymentMethod)
                            }
                            size={20}
                            color={
                              paymentMethod === method
                                ? tw.color("primary-600")
                                : tw.color("gray-600")
                            }
                          />
                          <ThemedText
                            type="body2"
                            style={tw`${
                              paymentMethod === method
                                ? "text-primary-700 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {method === "all"
                              ? t("bills:filters.allPaymentMethods")
                              : translatePaymentMethod(method as PaymentMethod)}
                          </ThemedText>
                        </ThemedView>
                        {paymentMethod === method && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={tw.color("primary-600")}
                          />
                        )}
                      </ThemedView>
                    </Pressable>
                  ))}
                </ThemedView>
              </ThemedView>

              {/* Payment Status Filter */}
              <ThemedView style={tw`gap-3`}>
                <ThemedText type="body1" style={tw`font-semibold`}>
                  {t("bills:filters.paymentStatus")}
                </ThemedText>
                <ThemedView style={tw`gap-2`}>
                  {paymentStatuses.map((status) => {
                    const getStatusIcon = () => {
                      if (status === "paid") return "checkmark-circle-outline";
                      if (status === "unpaid") return "time-outline";
                      return "apps-outline";
                    };

                    const getStatusLabel = () => {
                      if (status === "paid") return t("bills:filters.paid");
                      if (status === "unpaid") return t("bills:filters.unpaid");
                      return t("bills:filters.allStatuses");
                    };

                    return (
                      <Pressable
                        key={status}
                        onPress={() => setPaymentStatus(status)}
                      >
                        <ThemedView
                          style={tw`flex-row items-center justify-between p-3 rounded-xl border ${
                            paymentStatus === status
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <ThemedView style={tw`flex-row items-center gap-3`}>
                            <Ionicons
                              name={getStatusIcon()}
                              size={20}
                              color={
                                paymentStatus === status
                                  ? tw.color("primary-600")
                                  : tw.color("gray-600")
                              }
                            />
                            <ThemedText
                              type="body2"
                              style={tw`${
                                paymentStatus === status
                                  ? "text-primary-700 font-semibold"
                                  : "text-gray-700"
                              }`}
                            >
                              {getStatusLabel()}
                            </ThemedText>
                          </ThemedView>
                          {paymentStatus === status && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={tw.color("primary-600")}
                            />
                          )}
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Actions */}
            <ThemedView
              style={tw`flex-row gap-3 p-5 border-t border-gray-200`}
            >
              <ThemedView style={tw`flex-1`}>
                <Button
                  label={t("bills:filters.reset")}
                  onPress={handleReset}
                  variant="outline"
                />
              </ThemedView>
              <ThemedView style={tw`flex-1`}>
                <Button
                  label={t("bills:filters.apply")}
                  onPress={handleApply}
                />
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
