import { toast } from "sonner-native";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTranslation } from "react-i18next";
import {
  Transaction,
  isCashWithdrawal,
} from "@/core/transactions/models/transaction.model";
import { formatCurrency } from "@/core/i18n/utils";
import { getErrorMessage } from "@/core/api/get-error-message";
import { useApproveTransaction } from "../hooks/useTransaction";

interface ApproveTransactionModalProps {
  transaction: Transaction | null | undefined;
  visible: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export default function ApproveTransactionModal({
  transaction,
  visible,
  onClose,
  onApproved,
}: ApproveTransactionModalProps) {
  const { t } = useTranslation(["common", "bills"]);
  const { approveTransaction, isLoading } = useApproveTransaction();
  const isWithdrawal = isCashWithdrawal(transaction ?? undefined);

  const handleConfirm = () => {
    if (!transaction) return;

    approveTransaction(transaction.id, {
      onSuccess: () => {
        onClose();
        toast.success(
          isWithdrawal
            ? t("common:cashRegister.withdraw.approved")
            : t("bills:proofUpload.autoApproved"),
        );
        onApproved?.();
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, { fallbackToServerMessage: true }));
      },
    });
  };

  // Name the money and where it should have landed: the cashier is
  // confirming a fact, not answering "are you sure?".
  const account = transaction?.account
    ? transaction.account.num
      ? `${transaction.account.name} #${transaction.account.num}`
      : transaction.account.name
    : "";

  return (
    <DialogModal
      visible={visible}
      title={
        isWithdrawal
          ? t("common:cashRegister.withdraw.approveTitle")
          : t("bills:proofUpload.approveTitle")
      }
      message={
        isWithdrawal
          ? t("common:cashRegister.withdraw.approveMessage", {
              amount: transaction ? formatCurrency(transaction.amount) : "",
              account,
              reason: transaction?.name ?? "",
            })
          : t("bills:proofUpload.approveMessage", {
              amount: transaction ? formatCurrency(transaction.amount) : "",
              account,
            })
      }
      confirmLabel={t("common:actions.approve")}
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={isLoading}
    />
  );
}
