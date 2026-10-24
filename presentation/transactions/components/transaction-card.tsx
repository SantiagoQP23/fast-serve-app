import { useState } from "react";
import { Pressable, PressableProps } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Icon from "@/presentation/theme/components/icon";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { formatCurrency, getRelativeTime } from "@/core/i18n/utils";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import IconButton from "@/presentation/theme/components/icon-button";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTransactions } from "@/presentation/transactions/hooks/useTransactions";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { isAdminLevelRole } from "@/core/auth/models/user.model";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import Label, { LabelProps } from "@/presentation/theme/components/label";
import { getPaymentMethodIcon } from "@/presentation/orders/components/payment-method-card";

interface TransactionCardProps extends PressableProps {
  transaction: Transaction;
  /** Highlights the transaction open in the detail pane (tablet). */
  active?: boolean;
}

export default function TransactionCard({
  transaction,
  onPress,
  active,
  ...rest
}: TransactionCardProps) {
  const { t } = useTranslation();
  const { removeTransaction } = useTransactions();
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = isAdminLevelRole(user?.role?.name);
  const relativeTime = getRelativeTime(transaction.createdAt);

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

  const amountLabelColor: LabelProps["color"] =
    transaction.status === TransactionStatus.COMPLETED
      ? "success"
      : transaction.status === TransactionStatus.PENDING_PROOF ||
          transaction.status === TransactionStatus.PENDING_APPROVAL
        ? "warning"
        : transaction.status === TransactionStatus.REJECTED
          ? "error"
          : "default";

  // The amount pill's color isn't enough on its own: say it in words too.
  const statusText =
    transaction.status === TransactionStatus.PENDING_PROOF ||
    transaction.status === TransactionStatus.PENDING_APPROVAL
      ? t("common:status.pending")
      : transaction.status === TransactionStatus.REJECTED
        ? t("common:status.rejected")
        : transaction.status === TransactionStatus.CANCELLED
          ? t("common:status.cancelled")
          : null;

  const methodAndAccount = [transaction.account?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Swipeable
        containerStyle={tw`rounded-md`}
        renderRightActions={
          canRemoveTransaction
            ? () => (
                <ThemedView style={tw`justify-center items-center px-4 `}>
                  <IconButton
                    icon="trash"
                    variant="surface"
                    onPress={onRemoveTransaction}
                    size={26}
                  />
                </ThemedView>
              )
            : undefined
        }
      >
        <Pressable
          onPress={onPress}
          {...rest}
          style={tw.style(active && "bg-secondary rounded-md")}
          accessibilityRole="button"
        >
          <ThemedView style={tw`flex-row justify-between`}>
            <ThemedView style={tw`flex-row gap-3 flex-1 items-center`}>
              <ThemedView style={tw`w-10 h-10 items-center justify-center`}>
                <Icon
                  name={
                    transaction.paymentMethod
                      ? getPaymentMethodIcon(transaction.paymentMethod.type)
                      : "circle-dollar-sign"
                  }
                  size={24}
                  color={tw.color("gray-600")}
                />
              </ThemedView>

              <ThemedView style={tw`flex-1 gap-1`}>
                <ThemedText type="body1" numberOfLines={1}>
                  {methodAndAccount}
                </ThemedText>
                <ThemedText type="small">
                  {getUserDisplayName(
                    transaction.createdBy,
                    t("common:labels.deletedUser"),
                  )}
                </ThemedText>
                <ThemedView style={tw`flex-row items-center gap-2 mt-0.5`}>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {statusText
                      ? `${relativeTime} · ${statusText}`
                      : relativeTime}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Label
                color={amountLabelColor}
                text={formatCurrency(transaction.amount)}
              />
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Swipeable>

      <DialogModal
        visible={showDeleteModal}
        title={t("common:transactions.deleteConfirmTitle")}
        message={t("common:transactions.deleteConfirmMessage")}
        confirmLabel={t("common:actions.delete")}
        confirmVariant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
