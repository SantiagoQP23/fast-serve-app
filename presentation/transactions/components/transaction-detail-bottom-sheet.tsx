import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Image,
  Alert,
  TextInput as RNTextInput,
} from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Transaction } from "@/core/transactions/models/transaction.model";
import { PaymentProofStatus } from "@/core/transactions/models/payment-proof.model";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { formatCurrency } from "@/core/i18n/utils";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "react-i18next";

interface TransactionDetailBottomSheetProps {
  transaction: Transaction | null;
}

export default function TransactionDetailBottomSheet({
  transaction,
}: TransactionDetailBottomSheetProps) {
  const { t } = useTranslation(["common", "bills"]);
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === "admin";

  const transactionId = transaction?.id;
  const {
    proofs,
    approveProof,
    rejectProof,
  } = usePaymentProofs(transactionId);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = useCallback(
    (proofId: number) => {
      Alert.alert(
        t("bills:proofUpload.approveTitle"),
        t("bills:proofUpload.approveMessage"),
        [
          { text: t("common:actions.cancel"), style: "cancel" },
          {
            text: t("common:actions.approve"),
            style: "default",
            onPress: () => {
              approveProof.mutate({ id: proofId });
            },
          },
        ]
      );
    },
    [approveProof, t]
  );

  const handleReject = useCallback(
    (proofId: number) => {
      if (!rejectReason.trim()) {
        setShowRejectInput(true);
        return;
      }
      Alert.alert(
        t("bills:proofUpload.rejectTitle"),
        t("bills:proofUpload.rejectMessage"),
        [
          { text: t("common:actions.cancel"), style: "cancel" },
          {
            text: t("common:actions.reject"),
            style: "destructive",
            onPress: () => {
              rejectProof.mutate({ id: proofId, reason: rejectReason.trim() });
              setRejectReason("");
              setShowRejectInput(false);
            },
          },
        ]
      );
    },
    [rejectProof, rejectReason, t]
  );

  if (!transaction) return null;

  return (
    <ThemedView style={tw`flex-1 px-4 pt-4 pb-8`}>
      <ThemedView
        style={tw`w-12 h-1.5 rounded-full bg-gray-300 self-center mb-4`}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView style={tw`items-center mb-6`}>
          <ThemedText type="h3" style={tw`font-bold`}>
            {transaction.name}
          </ThemedText>
          <ThemedText style={tw`text-3xl font-bold mt-2`}>
            {formatCurrency(transaction.amount)}
          </ThemedText>
          <ThemedView style={tw`flex-row items-center gap-2 mt-2`}>
            <StatusBadge status={transaction.status} />
          </ThemedView>
        </ThemedView>

        {/* Details */}
        <ThemedView style={tw`gap-4 mb-6`}>
          <DetailRow
            icon="wallet-outline"
            label={t("common:transactions.paymentMethod")}
            value={transaction.paymentMethod.name}
          />
          <DetailRow
            icon="business-outline"
            label={t("common:transactions.account")}
            value={transaction.account.name}
          />
          <DetailRow
            icon="pricetag-outline"
            label={t("common:transactions.category")}
            value={transaction.category.name}
          />
          <DetailRow
            icon="person-outline"
            label={t("common:transactions.createdBy")}
            value={`${transaction.createdBy.person.firstName} ${transaction.createdBy.person.lastName}`}
          />
          {transaction.description && (
            <DetailRow
              icon="document-text-outline"
              label={t("common:transactions.description")}
              value={transaction.description}
            />
          )}
        </ThemedView>

        {/* Proofs */}
        {proofs.length > 0 && (
          <ThemedView style={tw`gap-4 mb-6`}>
            <ThemedText type="h4" style={tw`font-bold`}>
              {t("bills:proofUpload.proofHistory")}
            </ThemedText>

            {proofs.map((proof) => (
              <ThemedView
                key={proof.id}
                style={tw`rounded-xl border border-gray-200 overflow-hidden`}
              >
                <Image
                  source={{ uri: proof.fileUrl }}
                  style={tw`w-full h-56`}
                  resizeMode="cover"
                />
                <ThemedView style={tw`p-4 gap-3`}>
                  <ThemedView
                    style={tw`flex-row items-center justify-between`}
                  >
                    <ThemedView style={tw`flex-row items-center gap-2`}>
                      <ProofStatusBadge status={proof.status} />
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {new Date(proof.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  {proof.uploadedBy && (
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {t("bills:proofUpload.uploadedBy")}:{" "}
                      {proof.uploadedBy.person.firstName}{" "}
                      {proof.uploadedBy.person.lastName}
                    </ThemedText>
                  )}

                  {proof.rejectionReason && (
                    <ThemedView
                      style={tw`p-2 rounded-lg bg-red-50 border border-red-100`}
                    >
                      <ThemedText type="small" style={tw`text-red-600`}>
                        {t("bills:proofUpload.rejectionReason")}:{" "}
                        {proof.rejectionReason}
                      </ThemedText>
                    </ThemedView>
                  )}

                  {proof.notes && (
                    <ThemedView
                      style={tw`p-2 rounded-lg bg-green-50 border border-green-100`}
                    >
                      <ThemedText type="small" style={tw`text-green-600`}>
                        {t("bills:proofUpload.approvalNotes")}: {proof.notes}
                      </ThemedText>
                    </ThemedView>
                  )}

                  {/* Admin actions */}
                  {isAdmin && proof.status === PaymentProofStatus.PENDING && (
                    <ThemedView style={tw`gap-3 mt-2`}>
                      {showRejectInput && (
                        <RNTextInput
                          value={rejectReason}
                          onChangeText={setRejectReason}
                          placeholder={t(
                            "bills:proofUpload.rejectReasonPlaceholder"
                          )}
                          style={tw`border border-gray-300 rounded-xl p-3 text-base text-gray-800`}
                          multiline
                          numberOfLines={2}
                        />
                      )}
                      <ThemedView style={tw`flex-row gap-3`}>
                        <Button
                          label={t("common:actions.approve")}
                          onPress={() => handleApprove(proof.id)}
                          loading={approveProof.isPending}
                          disabled={approveProof.isPending}
                          style={tw`flex-1`}
                        />
                        <Button
                          label={t("common:actions.reject")}
                          variant="outline"
                          onPress={() => handleReject(proof.id)}
                          loading={rejectProof.isPending}
                          disabled={rejectProof.isPending}
                          style={tw`flex-1`}
                        />
                      </ThemedView>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <ThemedView style={tw`flex-row items-center gap-3`}>
      <Ionicons name={icon as any} size={18} color={tw.color("gray-400")} />
      <ThemedView style={tw`flex-1`}>
        <ThemedText type="small" style={tw`text-gray-500`}>
          {label}
        </ThemedText>
        <ThemedText type="body2" style={tw`font-medium text-gray-800`}>
          {value}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const { t } = useTranslation();

  const config: Record<
    TransactionStatus,
    { bg: string; text: string; label: string; icon: string }
  > = {
    [TransactionStatus.COMPLETED]: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: t("common:transactions.status.completed"),
      icon: "checkmark-circle-outline",
    },
    [TransactionStatus.PENDING_PROOF]: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: t("common:transactions.status.pendingProof"),
      icon: "document-attach-outline",
    },
    [TransactionStatus.PENDING_APPROVAL]: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: t("common:transactions.status.pendingApproval"),
      icon: "time-outline",
    },
    [TransactionStatus.REJECTED]: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: t("common:transactions.status.rejected"),
      icon: "close-circle-outline",
    },
    [TransactionStatus.CANCELLED]: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: t("common:transactions.status.cancelled"),
      icon: "ban-outline",
    },
  };

  const c = config[status] || config[TransactionStatus.COMPLETED];

  return (
    <ThemedView style={tw`flex-row items-center gap-1 px-3 py-1 rounded-full ${c.bg}`}>
      <Ionicons name={c.icon as any} size={14} color={tw.color(c.text.replace("text-", "").replace("-700", "-600"))} />
      <ThemedText type="small" style={tw`${c.text} font-medium`}>
        {c.label}
      </ThemedText>
    </ThemedView>
  );
}

function ProofStatusBadge({ status }: { status: PaymentProofStatus }) {
  const { t } = useTranslation();

  const config: Record<
    PaymentProofStatus,
    { bg: string; text: string; label: string }
  > = {
    [PaymentProofStatus.PENDING]: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: t("common:status.pending"),
    },
    [PaymentProofStatus.APPROVED]: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: t("common:status.approved"),
    },
    [PaymentProofStatus.REJECTED]: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: t("common:status.rejected"),
    },
  };

  const c = config[status];

  return (
    <ThemedView
      style={tw`px-2 py-0.5 rounded-full ${c.bg}`}
    >
      <ThemedText type="small" style={tw`${c.text} font-medium`}>
        {c.label}
      </ThemedText>
    </ThemedView>
  );
}
