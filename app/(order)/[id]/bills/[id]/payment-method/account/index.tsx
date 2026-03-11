import { ScrollView, Alert } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import {
  PaymentMethodCategory,
} from "@/core/restaurant/models/payment-method.model";
import { Account, AccountType } from "@/core/restaurant/models/account.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { Ionicons } from "@expo/vector-icons";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { Pressable } from "react-native";

export default function AccountScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();

  const bill = useOrdersStore((state) => state.activeBill);
  const order = useOrdersStore((state) => state.activeOrder);
  const discount = useOrdersStore((state) => state.billDiscount);
  const selectedPaymentMethod = useOrdersStore(
    (state) => state.selectedPaymentMethod,
  );
  const billReceivedAmount = useOrdersStore((state) => state.billReceivedAmount);
  const billTransferNote = useOrdersStore((state) => state.billTransferNote);
  const setSelectedAccount = useOrdersStore((state) => state.setSelectedAccount);

  const { updateBill } = useBills();
  const { mutate, isLoading } = updateBill;

  const totalAfterDiscount = bill ? bill.total - +discount : 0;
  const commissionRate = selectedPaymentMethod
    ? selectedPaymentMethod.commissionPercentage / 100
    : 0;
  const isCard =
    selectedPaymentMethod?.type === PaymentMethodCategory.CARD;
  const totalToPay = isCard
    ? totalAfterDiscount * (1 + commissionRate)
    : totalAfterDiscount;

  const accounts: Account[] =
    selectedPaymentMethod?.allowedDestinationAccounts ?? [];

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );

  // Pre-select the default destination account on mount
  useEffect(() => {
    if (selectedPaymentMethod?.defaultDestinationAccount) {
      setSelectedAccountId(
        selectedPaymentMethod.defaultDestinationAccount.id,
      );
    } else if (accounts.length === 1) {
      setSelectedAccountId(accounts[0].id);
    }
  }, []);

  if (!bill || !order || !selectedPaymentMethod) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("bills:list.noBills")}</ThemedText>
      </ThemedView>
    );
  }

  const handlePay = () => {
    if (!selectedAccountId) {
      Alert.alert("Select an account", "Please select a destination account to continue.");
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === selectedAccountId) ?? null;
    setSelectedAccount(selectedAcc);

    mutate(
      {
        id: bill.id,
        paymentMethod: String(selectedPaymentMethod.id),
        isPaid: true,
        discount: +discount || undefined,
        accountId: selectedAccountId,
        ...(selectedPaymentMethod.type === PaymentMethodCategory.CASH && {
          receivedAmount: +billReceivedAmount,
        }),
        ...(selectedPaymentMethod.type === PaymentMethodCategory.TRANSFER && {
          transferNote: billTransferNote || undefined,
        }),
      },
      {
        onSuccess: () => {
          router.back();
          router.back();
          router.back();
        },
        onError: (resp) => {
          Alert.alert(t("errors:general.error"), resp.msg);
        },
      },
    );
  };

  return (
    <ThemedView style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-6 pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {/* Total summary */}
        <ThemedView style={tw`items-center mb-8`}>
          <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
            {t("bills:details.totalToPay")}
          </ThemedText>
          <ThemedText style={tw`text-5xl font-bold`}>
            {formatCurrency(totalToPay)}
          </ThemedText>
          {isCard && commissionRate > 0 && (
            <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
              {t("bills:details.totalAmount")}: {formatCurrency(totalAfterDiscount)}{" "}
              + {selectedPaymentMethod.commissionPercentage}%{" "}
              {t("bills:details.commission").toLowerCase()}
            </ThemedText>
          )}
        </ThemedView>

        {/* Payment method info */}
        <ThemedView
          style={tw`flex-row items-center gap-3 p-4 rounded-2xl border border-gray-200 mb-6`}
        >
          <Ionicons name="card-outline" size={20} color={tw.color("gray-500")} />
          <ThemedText type="body2" style={tw`flex-1 text-gray-700`}>
            {selectedPaymentMethod.name}
          </ThemedText>
          {selectedPaymentMethod.type === PaymentMethodCategory.CASH &&
            billReceivedAmount ? (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              Received: {formatCurrency(+billReceivedAmount)}
            </ThemedText>
          ) : null}
        </ThemedView>

        {/* Account list */}
        <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
          Destination account
        </ThemedText>

        {accounts.length === 0 ? (
          <ThemedView style={tw`items-center py-8 gap-2`}>
            <Ionicons
              name="wallet-outline"
              size={40}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              No accounts available for this payment method.
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={tw`gap-3`}>
            {accounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  style={({ pressed }) => [
                    tw`flex-row items-center px-4 py-4 rounded-2xl border border-gray-200`,
                    pressed && tw`opacity-80`,
                    isSelected && tw`border-light-primary bg-gray-100`,
                  ]}
                >
                  <ThemedView
                    style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}
                  >
                    <Ionicons
                      name={
                        account.type === AccountType.BANK
                          ? "business-outline"
                          : "cash-outline"
                      }
                      size={20}
                      color={tw.color("gray-700")}
                    />
                  </ThemedView>
                  <ThemedView style={tw`flex-1 ml-3 gap-0.5 bg-transparent`}>
                    <ThemedText type="h4">{account.name}</ThemedText>
                    {account.num ? (
                      <ThemedText type="body2" style={tw`text-gray-500`}>
                        {account.num}
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                  <Label
                    text={account.type === AccountType.BANK ? "Bank" : "Cash"}
                    color={account.type === AccountType.BANK ? "info" : "default"}
                    size="small"
                  />
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={tw.color("green-500")}
                      style={tw`ml-2`}
                    />
                  )}
                </Pressable>
              );
            })}
          </ThemedView>
        )}
      </ScrollView>

      {/* Pay button */}
      <ThemedView
        style={tw`px-4 pb-6 pt-4 border-t border-gray-200`}
      >
        <Button
          label={`Pay ${formatCurrency(totalToPay)}`}
          onPress={handlePay}
          disabled={!selectedAccountId || isLoading || accounts.length === 0}
          loading={isLoading}
        />
      </ThemedView>
    </ThemedView>
  );
}
