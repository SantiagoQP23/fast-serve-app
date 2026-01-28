import React, { useState, useEffect, useMemo } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import Select from "@/presentation/theme/components/select";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import { translatePaymentMethod } from "@/core/i18n/utils";
import { BillListFiltersDto } from "@/core/orders/dto/bill-list-filters.dto";

interface BillsFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: BillListFiltersDto) => void;
  initialFilters?: BillListFiltersDto;
  availableWaiters: Array<{ id: string; fullName: string }>;
}

type PaymentStatusFilter = "all" | "paid" | "unpaid";

export default function BillsFilterBottomSheet({
  onClose,
  onApply,
  initialFilters,
  availableWaiters,
}: BillsFilterBottomSheetProps) {
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
  const [ownerId, setOwnerId] = useState<string | "all">(
    initialFilters?.ownerId || "all"
  );

  // Sync internal state with initialFilters when they change
  useEffect(() => {
    setPaymentMethod(initialFilters?.paymentMethod || "all");
    setPaymentStatus(
      initialFilters?.isPaid === undefined
        ? "all"
        : initialFilters.isPaid
        ? "paid"
        : "unpaid"
    );
    setOwnerId(initialFilters?.ownerId || "all");
  }, [initialFilters]);

  const handleReset = () => {
    setPaymentMethod("all");
    setPaymentStatus("all");
    setOwnerId("all");
    onApply({});
    onClose();
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

    if (ownerId !== "all") {
      filters.ownerId = ownerId;
    }
    
    onApply(filters);
    onClose();
  };

  // Payment Method options
  const paymentMethodOptions = useMemo(() => [
    { label: t("bills:filters.allPaymentMethods"), value: "all" },
    { label: translatePaymentMethod(PaymentMethod.CASH), value: PaymentMethod.CASH },
    { label: translatePaymentMethod(PaymentMethod.CREDIT_CARD), value: PaymentMethod.CREDIT_CARD },
    { label: translatePaymentMethod(PaymentMethod.TRANSFER), value: PaymentMethod.TRANSFER },
  ], [t]);

  // Payment Status options
  const paymentStatusOptions = useMemo(() => [
    { label: t("bills:filters.allStatuses"), value: "all" },
    { label: t("bills:filters.paid"), value: "paid" },
    { label: t("bills:filters.unpaid"), value: "unpaid" },
  ], [t]);

  // Waiter options
  const waiterOptions = useMemo(() => [
    { label: t("bills:filters.allWaiters"), value: "all" },
    ...availableWaiters.map((waiter) => ({
      label: waiter.fullName,
      value: waiter.id,
    })),
  ], [availableWaiters, t]);

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        {/* Header */}
        <ThemedText type="h3" style={tw`text-center`}>
          {t("bills:filters.title")}
        </ThemedText>

        {/* Payment Method Select */}
        <Select
          label={t("bills:filters.paymentMethod")}
          placeholder={t("bills:filters.allPaymentMethods")}
          options={paymentMethodOptions}
          value={paymentMethod}
          onChange={(value) => setPaymentMethod(value as PaymentMethod | "all")}
        />

        {/* Payment Status Select */}
        <Select
          label={t("bills:filters.paymentStatus")}
          placeholder={t("bills:filters.allStatuses")}
          options={paymentStatusOptions}
          value={paymentStatus}
          onChange={(value) => setPaymentStatus(value as PaymentStatusFilter)}
        />

        {/* Waiter Select */}
        <Select
          label={t("bills:filters.waiter")}
          placeholder={t("bills:filters.allWaiters")}
          options={waiterOptions}
          value={ownerId}
          onChange={(value) => setOwnerId(value as string)}
        />

        {/* Action Buttons */}
        <ThemedView style={tw`flex-row gap-3`}>
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
      </ThemedView>
    </BottomSheetView>
  );
}
