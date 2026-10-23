import { ScrollView, ActivityIndicator } from "react-native";
import { toast } from "sonner-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Button from "@/presentation/theme/components/button";
import Label from "@/presentation/theme/components/label";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { Account, AccountType } from "@/core/restaurant/models/account.model";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import Icon from "@/presentation/theme/components/icon";
import { useBills } from "@/presentation/orders/hooks/useBills";
import { Pressable } from "react-native";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { PaymentProofsService } from "@/core/transactions/services/payment-proofs.service";
import { usePaymentStore } from "@/presentation/payment/store/usePaymentStore";
import { generateIdempotencyKey } from "@/helpers/idempotency";
import { getErrorMessage } from "@/core/api/get-error-message";
import Card from "@/presentation/theme/components/card";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import {
  applyCommission,
  getBillAmountDue,
  isSameAmount,
  parseAmount,
} from "@/core/orders/utils/bill-payment.util";
import BillLoadState from "@/presentation/orders/components/bill-load-state";

export default function AccountScreen() {
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

  // Re-check what's left right before charging: another device may have
  // charged this bill while the cashier was picking a method.
  useFocusEffect(
    useCallback(() => {
      refetchBill();
    }, [refetchBill]),
  );

  const billAmount = useOrdersStore((state) => state.billAmount);
  const selectedPaymentMethod = useOrdersStore(
    (state) => state.selectedPaymentMethod,
  );
  const billReceivedAmount = useOrdersStore(
    (state) => state.billReceivedAmount,
  );
  const billTransferNote = useOrdersStore((state) => state.billTransferNote);
  const billRequestApproval = useOrdersStore(
    (state) => state.billRequestApproval,
  );
  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const setSelectedAccount = useOrdersStore(
    (state) => state.setSelectedAccount,
  );
  const setActivePendingTransaction = useOrdersStore(
    (state) => state.setActivePendingTransaction,
  );
  const pendingProofImage = useOrdersStore((state) => state.pendingProofImage);
  const setPendingProofImage = useOrdersStore(
    (state) => state.setPendingProofImage,
  );

  const { payBillTransaction } = useBills();
  const { mutate, isLoading } = payBillTransaction;
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  // Once charged, the refetched bill has less left to pay than this payment;
  // that's expected and shouldn't read as a stale amount while leaving.
  const [hasPaid, setHasPaid] = useState(false);
  const billPaymentIdempotencyKey = usePaymentStore(
    (state) => state.billPaymentIdempotencyKey,
  );
  const resetPaymentStore = usePaymentStore((state) => state.reset);

  const isTransfer =
    selectedPaymentMethod?.type === PaymentMethodCategory.TRANSFER;

  // The amount applied to the bill, as validated on the previous screen.
  // `bill.total` already has the discount in it, so nothing is subtracted here.
  const amountDue = bill ? getBillAmountDue(bill) : 0;
  const enteredAmount = parseAmount(billAmount);
  const amount = enteredAmount > 0 ? enteredAmount : amountDue;
  const exceedsAmountDue =
    !!bill &&
    !hasPaid &&
    amount > amountDue &&
    !isSameAmount(amount, amountDue);

  const isCard = selectedPaymentMethod?.type === PaymentMethodCategory.CARD;
  const commissionPercentage = isCard
    ? (selectedPaymentMethod?.commissionPercentage ?? 0)
    : 0;
  // What the customer is charged; the commission isn't applied to the bill.
  const totalToPay = applyCommission(amount, commissionPercentage);

  const accounts: Account[] =
    selectedPaymentMethod?.allowedDestinationAccounts ?? [];

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );

  // Pre-select the default destination account on mount
  useEffect(() => {
    if (selectedPaymentMethod?.defaultDestinationAccount) {
      setSelectedAccountId(selectedPaymentMethod.defaultDestinationAccount.id);
    } else if (accounts.length === 1) {
      setSelectedAccountId(accounts[0].id);
    }
  }, []);

  if (!bill || !selectedPaymentMethod) {
    return (
      <BillLoadState
        isLoading={isLoadingBill}
        error={billError}
        onRetry={refetchBill}
      />
    );
  }

  // Back to whatever opened the payment flow (the bill screen, or the sales
  // list when the bill is a tablet pane): pops this screen and the method
  // screen under it.
  const leavePaymentFlow = () => {
    router.back();
    router.back();
  };

  const handlePay = () => {
    if (exceedsAmountDue) return;
    if (!selectedAccountId) {
      toast.error(t("bills:account.selectAccountMessage"));
      return;
    }

    const selectedAcc =
      accounts.find((a) => a.id === selectedAccountId) ?? null;
    setSelectedAccount(selectedAcc);

    mutate(
      {
        idempotencyKey: billPaymentIdempotencyKey || generateIdempotencyKey(),
        name: `Ingreso por Venta #${String(bill.num)}`,
        amount,
        paymentMethodId: selectedPaymentMethod.id,
        accountId: selectedAccountId,
        billId: bill.id,
        ...(isTransfer && {
          description: billTransferNote || undefined,
        }),
        ...(isTransfer &&
          isAdmin &&
          !billRequestApproval && { requestApproval: false }),
      },
      {
        onSuccess: async (resp) => {
          setHasPaid(true);
          resetPaymentStore();
          const transaction = resp.data?.transaction;

          const uploadPendingProof = async (transactionId: number) => {
            if (!pendingProofImage) return;
            setIsUploadingProof(true);
            try {
              await PaymentProofsService.uploadProof(
                transactionId,
                pendingProofImage.uri,
                pendingProofImage.fileName,
                pendingProofImage.mimeType,
              );
              setPendingProofImage(null);
              toast.success(t("bills:proofUpload.uploadSuccess"));
            } catch (error: any) {
              toast.error(
                getErrorMessage(error, { fallbackToServerMessage: true }),
              );
            } finally {
              setIsUploadingProof(false);
            }
          };

          if (transaction?.status === TransactionStatus.PENDING_PROOF) {
            setActivePendingTransaction(transaction as Transaction);

            await uploadPendingProof(transaction.id);

            // Leave the flow whether the upload succeeded or not
            if (bill.source === "direct") {
              router.replace({
                pathname: "/(app)/(tabs)/(orders-module)/my-orders",
                params: { module: "sales" },
              });
            } else {
              leavePaymentFlow();
            }
            return;
          }

          // Transfer an admin approved on the spot: attach the optional proof,
          // then leave like any other completed payment.
          if (
            isTransfer &&
            transaction?.status === TransactionStatus.COMPLETED
          ) {
            toast.success(t("bills:proofUpload.autoApproved"));
            await uploadPendingProof(transaction.id);
          }

          leavePaymentFlow();
        },
        onError: (resp) => {
          toast.error(resp.msg || t("errors:general.error"));
        },
      },
    );
  };

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ThemedView style={tw`px-4 pt-6`}>
        {/* Total summary */}
        <ThemedView style={tw`items-center mb-8`}>
          <ThemedText type="caption" style={tw`text-gray-500 mb-1`}>
            {t("bills:details.totalToPay")}
          </ThemedText>
          <ThemedText style={tw`text-5xl `}>
            {formatCurrency(totalToPay)}
          </ThemedText>
          {commissionPercentage > 0 && (
            <ThemedText type="body2" style={tw`text-gray-500 mt-1`}>
              {t("bills:details.totalAmount")}: {formatCurrency(amount)} +{" "}
              {commissionPercentage}%{" "}
              {t("bills:details.commission").toLowerCase()}
            </ThemedText>
          )}
        </ThemedView>

        {/* Payment method info */}
        <ThemedView
          style={tw`flex-row items-center justify-center gap-3 py-4 rounded-2xl  mb-6`}
        >
          <Icon
            name="credit-card"
            size={26}
            color={tw.color("gray-500")}
          />
          <ThemedText type="h3" style={tw`flex-1 text-gray-700`}>
            {selectedPaymentMethod.name}
          </ThemedText>
          {selectedPaymentMethod.type === PaymentMethodCategory.CASH &&
          billReceivedAmount ? (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:account.received")}:{" "}
              {formatCurrency(+billReceivedAmount)}
            </ThemedText>
          ) : null}
        </ThemedView>

        {/* Account list */}
        <ThemedText type="body2" style={tw`text-gray-500 mb-3`}>
          {t("bills:account.destinationAccount")}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-4 gap-3`}
        showsVerticalScrollIndicator={false}
      >
        {accounts.length === 0 ? (
          <ThemedView style={tw`items-center py-8 gap-2`}>
            <Icon
              name="wallet"
              size={40}
              color={tw.color("gray-400")}
            />
            <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
              {t("bills:account.noAccountsAvailable")}
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {accounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              return (
                <Card
                  key={account.id}
                  onPress={() => setSelectedAccountId(account.id)}
                  style={({ pressed }) => [
                    tw`flex-row items-center `,
                    pressed && tw`opacity-80`,
                    isSelected && tw`border-primary border-2`,
                  ]}
                  variant={isSelected ? "default" : "outline"}
                >
                  <ThemedView
                    style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}
                  >
                    <Icon
                      name={
                        account.type === AccountType.BANK
                          ? "building"
                          : "banknote"
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
                  {isSelected && (
                    <Icon
                      name="circle-check"
                      size={22}
                      color={tw.color("primary")}
                      style={tw`ml-2`}
                    />
                  )}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Pay button */}
      <ThemedView style={tw`px-4 pb-6 pt-4 gap-3`}>
        {exceedsAmountDue && (
          <ThemedText type="body2" style={tw`text-red-700 text-center`}>
            {t("bills:payment.amountChanged", {
              amount: formatCurrency(amountDue),
            })}
          </ThemedText>
        )}
        <Button
          label={
            isTransfer
              ? t("bills:account.confirmTransfer")
              : t("bills:account.payButton", {
                  amount: formatCurrency(totalToPay),
                })
          }
          onPress={handlePay}
          disabled={
            exceedsAmountDue ||
            !selectedAccountId ||
            isLoading ||
            isUploadingProof ||
            accounts.length === 0
          }
          loading={isLoading || isUploadingProof}
        />
      </ThemedView>

      {/* Full-screen upload overlay */}
      {isUploadingProof && (
        <ThemedView
          style={tw`absolute inset-0 bg-black/50 justify-center items-center z-50`}
        >
          <ThemedView
            style={tw`bg-surface-bright rounded-2xl p-6 items-center gap-3`}
          >
            <ActivityIndicator size="large" color={tw.color("primary")} />
            <ThemedText type="body1" style={tw`font-semibold`}>
              {t("bills:proofUpload.uploading")}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ScreenLayout>
  );
}
