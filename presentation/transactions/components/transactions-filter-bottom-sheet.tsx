import React, { useState, useEffect, useMemo } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import Select from "@/presentation/theme/components/select";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import { FilterTransactionsDto } from "@/core/transactions/dto/filter-transactions.dto";

interface TransactionsFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: FilterTransactionsDto) => void;
  initialFilters?: FilterTransactionsDto;
  availableUsers: Array<{ id: string; fullName: string }>;
  isAdmin?: boolean;
}

export default function TransactionsFilterBottomSheet({
  onClose,
  onApply,
  initialFilters,
  availableUsers,
  isAdmin = true,
}: TransactionsFilterBottomSheetProps) {
  const { t } = useTranslation(["common", "bills"]);
  const { paymentMethods } = usePaymentMethodsStore();

  const [paymentMethodId, setPaymentMethodId] = useState<number | "all">(
    initialFilters?.paymentMethodId || "all",
  );
  const [accountId, setAccountId] = useState<number | "all">(
    initialFilters?.accountId || "all",
  );
  const [createdById, setCreatedById] = useState<string | "all">(
    initialFilters?.createdById || "all",
  );

  // Sync internal state with initialFilters when they change
  useEffect(() => {
    setPaymentMethodId(initialFilters?.paymentMethodId || "all");
    setAccountId(initialFilters?.accountId || "all");
    setCreatedById(initialFilters?.createdById || "all");
  }, [initialFilters]);

  // Get selected payment method
  const selectedPaymentMethod = useMemo(() => {
    if (paymentMethodId === "all") return null;
    return paymentMethods.find((pm) => pm.id === paymentMethodId);
  }, [paymentMethodId, paymentMethods]);

  // Reset account when payment method changes
  useEffect(() => {
    if (paymentMethodId === "all") {
      setAccountId("all");
    } else {
      // If current account is not in the new payment method's allowed accounts, reset
      const allowedAccountIds =
        selectedPaymentMethod?.allowedDestinationAccounts.map((acc) => acc.id) ||
        [];
      if (
        accountId !== "all" &&
        !allowedAccountIds.includes(accountId as number)
      ) {
        setAccountId("all");
      }
    }
  }, [paymentMethodId, selectedPaymentMethod, accountId]);

  const handleReset = () => {
    setPaymentMethodId("all");
    setAccountId("all");
    setCreatedById("all");
    onApply({});
    onClose();
  };

  const handleApply = () => {
    const filters: FilterTransactionsDto = {};

    if (paymentMethodId !== "all") {
      filters.paymentMethodId = paymentMethodId as number;
    }

    if (accountId !== "all" && paymentMethodId !== "all") {
      filters.accountId = accountId as number;
    }

    if (createdById !== "all") {
      filters.createdById = createdById;
    }

    onApply(filters);
    onClose();
  };

  // Payment Method options
  const paymentMethodOptions = useMemo(
    () => [
      { label: t("common:filters.all"), value: "all" },
      ...paymentMethods
        .filter((pm) => pm.isActive)
        .map((pm) => ({
          label: pm.name,
          value: pm.id,
        })),
    ],
    [paymentMethods, t],
  );

  // Account options (only show if payment method is selected)
  const accountOptions = useMemo(() => {
    if (!selectedPaymentMethod) return [];

    return [
      { label: t("common:filters.all"), value: "all" },
      ...selectedPaymentMethod.allowedDestinationAccounts
        .filter((acc) => acc.isActive)
        .map((acc) => ({
          label: acc.name,
          value: acc.id,
        })),
    ];
  }, [selectedPaymentMethod, t]);

  // User options
  const userOptions = useMemo(
    () => [
      { label: t("common:filters.allUsers"), value: "all" },
      ...availableUsers.map((user) => ({
        label: user.fullName,
        value: user.id,
      })),
    ],
    [availableUsers, t],
  );

  return (
    <BottomSheetView style={tw`p-4`}>
      <ThemedView style={tw`w-full gap-6`}>
        {/* Header */}
        <ThemedText type="h3" style={tw`text-center`}>
          {t("common:actions.filter")}
        </ThemedText>

        {/* Payment Method Select */}
        <Select
          label={t("bills:details.paymentMethod")}
          placeholder={t("common:filters.all")}
          options={paymentMethodOptions}
          value={paymentMethodId}
          onChange={(value) => setPaymentMethodId(value as number | "all")}
        />

        {/* Account Select - Only show if payment method is selected */}
        {paymentMethodId !== "all" && accountOptions.length > 0 && (
          <Select
            label="Account"
            placeholder={t("common:filters.all")}
            options={accountOptions}
            value={accountId}
            onChange={(value) => setAccountId(value as number | "all")}
          />
        )}

        {/* User Select - Only show for admin users */}
        {isAdmin && (
          <Select
            label={t("common:filters.user")}
            placeholder={t("common:filters.allUsers")}
            options={userOptions}
            value={createdById}
            onChange={(value) => setCreatedById(value as string)}
          />
        )}

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
