import React, { useState, useEffect, useMemo } from "react";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import Chip from "@/presentation/theme/components/chip";
import { PaymentMethod } from "@/core/orders/enums/payment-method";
import { translatePaymentMethod } from "@/core/i18n/utils";
import {
  BillListFiltersDto,
  BillStatusFilter,
} from "@/core/orders/dto/bill-list-filters.dto";
import { BillSource } from "@/core/orders/models/bill.model";

interface BillsFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: BillListFiltersDto) => void;
  initialFilters?: BillListFiltersDto;
  availableWaiters: Array<{ id: string; fullName: string }>;
  isAdmin?: boolean;
  /** Optional per-status counts shown next to the status chips. */
  statusCounts?: { paid: number; unpaid: number };
  /** Hide the status section when the screen shows it inline (Sales tab). */
  showStatusFilter?: boolean;
}

export default function BillsFilterBottomSheet({
  onClose,
  onApply,
  initialFilters,
  availableWaiters,
  isAdmin = true,
  statusCounts,
  showStatusFilter = true,
}: BillsFilterBottomSheetProps) {
  const { t } = useTranslation(["bills", "common"]);

  const [status, setStatus] = useState<BillStatusFilter | "all">(
    initialFilters?.status || "all",
  );
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
    setStatus(initialFilters?.status || "all");
    setPaymentMethod(initialFilters?.paymentMethod || "all");
    setOwnerId(initialFilters?.ownerId || "all");
    setSource(initialFilters?.source || "all");
  }, [initialFilters]);

  const handleReset = () => {
    setStatus("all");
    setPaymentMethod("all");
    setOwnerId("all");
    setSource("all");
    onApply({});
    onClose();
  };

  const handleApply = () => {
    const filters: BillListFiltersDto = {};

    if (status !== "all") {
      filters.status = status;
    }

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

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        {/* Header */}
        <ThemedText type="h3" style={tw`text-center`}>
          {t("bills:filters.title")}
        </ThemedText>

        {/* Status Filter */}
        {showStatusFilter && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("bills:filters.paymentStatus")}
            </ThemedText>
            <ThemedView style={tw`flex-row gap-2`}>
              <Chip
                label={t("bills:filters.all")}
                selected={status === "all"}
                onPress={() => setStatus("all")}
              />
              <Chip
                label={t("bills:filters.paidCount")}
                rightContent={
                  statusCounts && (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {statusCounts.paid}
                    </ThemedText>
                  )
                }
                selected={status === BillStatusFilter.PAID}
                onPress={() => setStatus(BillStatusFilter.PAID)}
              />
              <Chip
                label={t("bills:filters.unpaidCount")}
                rightContent={
                  statusCounts && (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {statusCounts.unpaid}
                    </ThemedText>
                  )
                }
                selected={status === BillStatusFilter.UNPAID}
                onPress={() => setStatus(BillStatusFilter.UNPAID)}
              />
            </ThemedView>
          </ThemedView>
        )}

        {/* Waiter Select - Only show for admin users */}
        {isAdmin && (
          <ThemedView style={tw`gap-2`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("bills:filters.waiter")}
            </ThemedText>
            <ThemedView style={tw`flex-row flex-wrap gap-2`}>
              <Chip
                label={t("bills:filters.allWaiters")}
                selected={ownerId === "all"}
                onPress={() => setOwnerId("all")}
              />
              {availableWaiters.map((waiter) => (
                <Chip
                  key={waiter.id}
                  label={waiter.fullName}
                  selected={ownerId === waiter.id}
                  onPress={() => setOwnerId(waiter.id)}
                />
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {/* Source Filter */}
        <ThemedView style={tw`gap-2`}>
          <ThemedText type="small" style={tw`text-gray-500`}>
            {t("bills:filters.source")}
          </ThemedText>
          <ThemedView style={tw`flex-row gap-2`}>
            <Chip
              label={t("bills:filters.allSources")}
              selected={source === "all"}
              onPress={() => setSource("all")}
            />
            <Chip
              label={t("bills:filters.order")}
              selected={source === BillSource.ORDER}
              onPress={() => setSource(BillSource.ORDER)}
            />
            <Chip
              label={t("bills:filters.direct")}
              selected={source === BillSource.DIRECT}
              onPress={() => setSource(BillSource.DIRECT)}
            />
          </ThemedView>
        </ThemedView>

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
