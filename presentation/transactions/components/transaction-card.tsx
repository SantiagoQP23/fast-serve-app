import React, { useState } from "react";
import { Pressable, PressableProps } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { TransactionType } from "@/core/transactions/models/transaction-category.model";
import { formatCurrency, getRelativeTime } from "@/core/i18n/utils";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTransactions } from "@/presentation/transactions/hooks/useTransactions";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";

interface TransactionCardProps extends PressableProps {
  transaction: Transaction;
}

export default function TransactionCard({
  transaction,
  onPress,
  ...rest
}: TransactionCardProps) {
  const { t } = useTranslation();
  const { removeTransaction } = useTransactions();
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = user?.role?.name === "admin";
  const isIncome =
    transaction.category.transactionType === TransactionType.INCOME;
  const relativeTime = getRelativeTime(transaction.createdAt);

  const categoryColor = transaction.category.color ?? "#6b7280";

  const onRemoveTransaction = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    removeTransaction.mutate({
      transactionId: transaction.id.toString(),
    });
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const canRemoveTransaction =
    isAdmin &&
    new Date().getTime() - new Date(transaction.createdAt).getTime() <
      60 * 60 * 1000;

  const getStatusDot = () => {
    const color =
      transaction.status === TransactionStatus.PENDING_PROOF
        ? "bg-orange-500"
        : transaction.status === TransactionStatus.PENDING_APPROVAL
          ? "bg-yellow-500"
          : transaction.status === TransactionStatus.REJECTED
            ? "bg-red-500"
            : null;
    if (!color) return null;
    return <ThemedView style={tw`w-2 h-2 rounded-full ${color}`} />;
  };

  const hasProofs =
    transaction.proofs && transaction.proofs.length > 0;

  return (
    <>
      <Swipeable
        renderRightActions={
          canRemoveTransaction
            ? () => (
                <ThemedView style={tw`justify-center items-center px-4 `}>
                  <IconButton
                    icon="trash-outline"
                    color="red"
                    onPress={onRemoveTransaction}
                  />
                </ThemedView>
              )
            : undefined
        }
      >
        <Pressable onPress={onPress} {...rest}>
          <ThemedView
            style={tw`flex-row items-center justify-between py-3 border-b border-gray-100`}
          >
            {/* Left: Colored icon circle + transaction info */}
            <ThemedView style={tw`flex-row items-center gap-3 flex-1`}>
              {/* Category color circle */}
              <ThemedView
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: `${categoryColor}1A` },
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={categoryColor}
                />
              </ThemedView>

              {/* Transaction details */}
              <ThemedView style={tw`flex-1 gap-0.5`}>
                <ThemedText
                  type="body1"
                  style={tw`font-semibold`}
                  numberOfLines={1}
                >
                  {transaction.name}
                </ThemedText>
                <ThemedText type="body2" style={tw`text-gray-500 `}>
                  {transaction.account.name}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-1.5`}>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-400`}
                    numberOfLines={1}
                  >
                    {transaction.createdBy.person.firstName}{" "}
                    {transaction.createdBy.person.lastName}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={tw`flex-row items-center gap-2 mt-0.5`}>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {relativeTime}
                  </ThemedText>
                  {getStatusDot()}
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Right: Amount colored by transaction type */}
            <ThemedView style={tw`items-end pl-2`}>
              <ThemedText
                type="body1"
                style={tw`font-semibold ${isIncome ? "text-green-700" : "text-red-600"}`}
              >
                {isIncome ? "" : "-"}
                {formatCurrency(transaction.amount)}
              </ThemedText>
              {hasProofs && (
                <Ionicons
                  name="image-outline"
                  size={14}
                  color={tw.color("gray-400")}
                  style={tw`mt-1`}
                />
              )}
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Swipeable>

      <DialogModal
        visible={showDeleteModal}
        title={t("common:transactions.deleteConfirmTitle")}
        message={t("common:transactions.deleteConfirmMessage")}
        confirmText={t("common:actions.delete")}
        cancelText={t("common:actions.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
