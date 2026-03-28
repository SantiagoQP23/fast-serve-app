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
import { BillSource } from "@/core/orders/models/bill.model";

interface BillsFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: BillListFiltersDto) => void;
  initialFilters?: BillListFiltersDto;
  availableWaiters: Array<{ id: string; fullName: string }>;
  isAdmin?: boolean;
}

export default function BillsFilterBottomSheet({
  onClose,
  onApply,
  initialFilters,
  availableWaiters,
  isAdmin = true,
}: BillsFilterBottomSheetProps) {
  const { t } = useTranslation(["bills", "common"]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">(
    initialFilters?.paymentMethod || "all",
  );
  const [ownerId, setOwnerId] = useState<string | "all">(
    initialFilters?.ownerId || "all",
  );
  const [source, setSource] = useState<BillSource | "all">(
    initialFilters?.source || "all",
  );

  // Sync internal state with initialFilters when they change
  useEffect(() => {
    setPaymentMethod(initialFilters?.paymentMethod || "all");
    setOwnerId(initialFilters?.ownerId || "all");
    setSource(initialFilters?.source || "all");
  }, [initialFilters]);

  const handleReset = () => {
    setPaymentMethod("all");
    setOwnerId("all");
    setSource("all");
    onApply({});
    onClose();
  };

  const handleApply = () => {
    const filters: BillListFiltersDto = {};

    if (paymentMethod !== "all") {
      filters.paymentMethod = paymentMethod as PaymentMethod;
    }

    if (ownerId !== "all") {
      filters.ownerId = ownerId;
    }

    if (source !== "all") {
      filters.source = source as BillSource;
    }

    onApply(filters);
    onClose();
  };

  // Payment Method options
  const paymentMethodOptions = useMemo(
    () => [
      { label: t("bills:filters.allPaymentMethods"), value: "all" },
      {
        label: translatePaymentMethod(PaymentMethod.CASH),
        value: PaymentMethod.CASH,
      },
      {
        label: translatePaymentMethod(PaymentMethod.CREDIT_CARD),
        value: PaymentMethod.CREDIT_CARD,
      },
      {
        label: translatePaymentMethod(PaymentMethod.TRANSFER),
        value: PaymentMethod.TRANSFER,
      },
    ],
    [t],
  );

  // Waiter options
  const waiterOptions = useMemo(
    () => [
      { label: t("bills:filters.allWaiters"), value: "all" },
      ...availableWaiters.map((waiter) => ({
        label: waiter.fullName,
        value: waiter.id,
      })),
    ],
    [availableWaiters, t],
  );

  // Source options
  const sourceOptions = useMemo(
    () => [
      { label: t("bills:filters.allSources"), value: "all" },
      { label: t("bills:filters.order"), value: BillSource.ORDER },
      { label: t("bills:filters.direct"), value: BillSource.DIRECT },
    ],
    [t],
  );

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        {/* Header */}
        <ThemedText type="h3" style={tw`text-center`}>
          {t("bills:filters.title")}
        </ThemedText>

        {/* Waiter Select - Only show for admin users */}
        {isAdmin && (
          <Select
            label={t("bills:filters.waiter")}
            placeholder={t("bills:filters.allWaiters")}
            options={waiterOptions}
            value={ownerId}
            onChange={(value) => setOwnerId(value as string)}
          />
        )}

        {/* Source Select */}
        <Select
          label={t("bills:filters.source")}
          placeholder={t("bills:filters.allSources")}
          options={sourceOptions}
          value={source}
          onChange={(value) => setSource(value as BillSource | "all")}
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
            <Button label={t("bills:filters.apply")} onPress={handleApply} />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </BottomSheetView>
  );
}
