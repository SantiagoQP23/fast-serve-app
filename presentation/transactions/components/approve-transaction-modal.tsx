import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useTranslation } from "react-i18next";
import { Transaction } from "@/core/transactions/models/transaction.model";
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

  const handleConfirm = () => {
    if (!transaction) return;

    approveTransaction(transaction.id, {
      onSuccess: () => {
        onClose();
        onApproved?.();
      },
    });
  };

  return (
    <DialogModal
      visible={visible}
      title={t("bills:proofUpload.approveTitle")}
      message={t("bills:proofUpload.approveMessage")}
      confirmLabel={t("common:actions.approve")}
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={isLoading}
    />
  );
}
