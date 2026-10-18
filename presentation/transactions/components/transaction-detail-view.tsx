import React, { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  Image,
  Alert,
  Pressable,
  View,
  RefreshControl,
  Modal,
} from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { formatCurrency } from "@/core/i18n/utils";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  useTransaction,
  useUpdateTransaction,
  useRejectTransaction,
} from "@/presentation/transactions/hooks/useTransaction";
import { PaymentProofStatus } from "@/core/transactions/models/payment-proof.model";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import * as ImagePicker from "expo-image-picker";
import { PaymentProofsService } from "@/core/transactions/services/payment-proofs.service";
import ImageViewer from "react-native-image-zoom-viewer";
import { getUserDisplayName } from "@/core/auth/utils/get-user-display-name";
import { Roles, isAdminLevelRole } from "@/core/auth/models/user.model";
import IconButton from "@/presentation/theme/components/icon-button";
import dayjs from "dayjs";
import { useModal } from "@/presentation/shared/hooks/useModal";
import ApproveTransactionModal from "@/presentation/transactions/components/approve-transaction-modal";
import { getErrorMessage } from "@/core/api/get-error-message";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

interface TransactionDetailViewProps {
  transactionId: number;
  /**
   * Rendered as a pane next to the incomes list (tablet) instead of as its
   * own screen: shows a close button in place of the stack header.
   */
  embedded?: boolean;
  onClose?: () => void;
}

export default function TransactionDetailView({
  transactionId,
  embedded = false,
  onClose,
}: TransactionDetailViewProps) {
  const { t } = useTranslation(["common", "bills"]);
  const Container = embedded ? ThemedView : ScreenLayout;

  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const isCashier = user?.role?.name === Roles.CASHIER;
  const canManage = isAdmin || isCashier;

  const { transaction, isLoading, refetch } = useTransaction(transactionId);
  const { updateTransaction } = useUpdateTransaction();
  const { rejectTransaction, isLoading: isRejecting } = useRejectTransaction();

  const { paymentMethods } = usePaymentMethodsStore();
  const paymentMethod = transaction
    ? paymentMethods.find((pm) => pm.id === transaction.paymentMethod.id)
    : null;
  const allowedAccounts = paymentMethod?.allowedDestinationAccounts ?? [];

  const { proofs, refetchProofs } = usePaymentProofs(transactionId);

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const accountBottomSheetRef = useRef<BottomSheetPickerRef>(null);

  const {
    isOpen: approveModalIsOpen,
    handleOpen: openApproveModal,
    handleClose: closeApproveModal,
  } = useModal();

  const isTransfer =
    transaction?.paymentMethod?.type === PaymentMethodCategory.TRANSFER;

  const canUploadProof =
    isTransfer &&
    (transaction?.status === TransactionStatus.PENDING_PROOF ||
      transaction?.status === TransactionStatus.REJECTED);

  const canApproveTransaction =
    canManage &&
    isTransfer &&
    (transaction?.status === TransactionStatus.PENDING_PROOF ||
      transaction?.status === TransactionStatus.PENDING_APPROVAL ||
      transaction?.status === TransactionStatus.REJECTED);

  const canRejectTransaction =
    canManage &&
    isTransfer &&
    (transaction?.status === TransactionStatus.PENDING_PROOF ||
      transaction?.status === TransactionStatus.PENDING_APPROVAL);

  const pickImage = async (source: "camera" | "gallery") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        t("errors:general.permissionDenied"),
        t("errors:general.cameraPermissionRequired"),
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
          });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedImage || !transaction) return;

    setIsUploading(true);
    try {
      console.log("Uploading proof for transaction:", transaction.id);
      await PaymentProofsService.uploadProof(
        transaction.id,
        selectedImage.uri,
        selectedImage.fileName || "proof.jpg",
        selectedImage.mimeType || "image/jpeg",
      );
      setSelectedImage(null);
      refetch();
      refetchProofs();
    } catch (error: any) {
      Alert.alert(
        t("errors:general.error"),
        getErrorMessage(error, { fallbackToServerMessage: true }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleTransactionApproved = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRejectTransaction = useCallback(() => {
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
            rejectTransaction(
              { id: transactionId, reason: rejectReason.trim() },
              {
                onSuccess: () => {
                  setRejectReason("");
                  setShowRejectInput(false);
                  refetch();
                },
              },
            );
          },
        },
      ],
    );
  }, [rejectTransaction, transactionId, rejectReason, refetch, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await refetchProofs();
    setRefreshing(false);
  }, [refetch, refetchProofs]);

  const handleChangeAccount = (accountId: string | number) => {
    updateTransaction(
      { id: transactionId, data: { accountId: Number(accountId) } },
      {
        onSuccess: () => {
          accountBottomSheetRef.current?.dismiss();
          refetch();
        },
      },
    );
  };

  const openAccountPicker = () => {
    accountBottomSheetRef.current?.present();
  };

  const allPreviewImages = [
    ...proofs.map((p) => ({ url: p.fileUrl })),
    ...(selectedImage ? [{ url: selectedImage.uri }] : []),
  ];

  const openPreview = (index: number) => {
    if (allPreviewImages.length === 0) return;
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  if (isLoading || !transaction) {
    return (
      <Container
        style={tw`flex-1 justify-center items-center bg-background`}
      >
        <ThemedText type="body2" style={tw`text-gray-400`}>
          {t("common:status.loading")}
        </ThemedText>
      </Container>
    );
  }

  return (
    <Container style={tw`flex-1 bg-background`}>
      {/* Pane header: stands in for the stack header when embedded */}
      {embedded && (
        <ThemedView style={tw`flex-row items-center px-4 pt-2`}>
          <IconButton
            icon="x"
            accessibilityLabel={t("common:actions.close")}
            onPress={onClose}
            size={24}
          />
        </ThemedView>
      )}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-4 pb-24 gap-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Amount Card */}
        <ThemedView style={tw` gap-3 items-center`}>
          <ThemedText
            type="body1"
            style={tw`font-semibold text-gray-500 text-center`}
          >
            {transaction.name}
          </ThemedText>
          <ThemedText style={tw`text-4xl `}>
            {formatCurrency(transaction.amount)}
          </ThemedText>
          <StatusBadge status={transaction.status} />
        </ThemedView>

        {/* Details Card */}
        <ThemedView
          style={tw`bg-surface rounded-2xl overflow-hidden p-6 gap-4`}
        >
          <DetailRow
            icon="wallet"
            label={t("common:transactions.paymentMethod")}
            value={transaction.paymentMethod.name}
          />

          {/* Account - editable for admin/cashier */}
          <ThemedView style={tw`flex-row items-center gap-4  py-3`}>
            <Icon
              name="building"
              size={18}
              color={tw.color("on-surface")}
            />
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="body1" style={tw`text-on-surface`}>
                {t("common:transactions.account")}
              </ThemedText>
              <ThemedText type="body2" style={tw`font-medium text-gray-800`}>
                {transaction.account.name}
                {transaction.account.num ? ` #${transaction.account.num}` : ""}
              </ThemedText>
            </ThemedView>
            {canManage && (
              <IconButton
                icon="square-pen"
                onPress={openAccountPicker}
                variant="secondary"
              />
            )}
          </ThemedView>

          <DetailRow
            icon="tag"
            label={t("common:transactions.category")}
            value={transaction.category.name}
          />
          <DetailRow
            icon="user"
            label={t("common:transactions.createdBy")}
            value={getUserDisplayName(
              transaction.createdBy,
              t("common:labels.deletedUser"),
            )}
          />
          {transaction.description && (
            <>
              <DetailRow
                icon="file-text"
                label={t("common:transactions.description")}
                value={transaction.description}
              />
            </>
          )}
          <DetailRow
            icon="calendar"
            label={t("common:labels.date")}
            value={dayjs(new Date(transaction.createdAt)).format(
              "DD MMM YYYY, HH:mm",
            )}
          />
        </ThemedView>

        {/* Upload Proof Section */}
        {isTransfer && (
          <ThemedView style={tw`gap-4`}>
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="h4" style={tw`font-bold`}>
                {t("bills:proofUpload.proofHistory")}
              </ThemedText>
              {proofs.some((p) => p.status === PaymentProofStatus.PENDING) && (
                <ThemedView style={tw`px-2 py-1 rounded-full bg-yellow-100`}>
                  <ThemedText
                    type="small"
                    style={tw`text-yellow-700 font-medium`}
                  >
                    {
                      proofs.filter(
                        (p) => p.status === PaymentProofStatus.PENDING,
                      ).length
                    }{" "}
                    {t("common:status.pending")}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Existing proofs */}
            {proofs.map((proof, index) => (
              <ThemedView
                key={proof.id}
                style={tw`rounded-xl border border-gray-200 overflow-hidden bg-surface-bright`}
              >
                <Pressable
                  onPress={() => openPreview(index)}
                  style={tw`relative`}
                >
                  <Image
                    source={{ uri: proof.fileUrl }}
                    style={tw`w-full h-40`}
                    resizeMode="cover"
                  />
                  <ThemedView style={tw`absolute top-3 right-3`}>
                    <ProofStatusBadge status={proof.status} />
                  </ThemedView>
                </Pressable>
                <ThemedView style={tw`p-4 gap-2`}>
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedText type="small" style={tw`text-gray-400`}>
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </ThemedText>
                    {proof.uploadedBy && (
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {proof.uploadedBy.person.firstName}{" "}
                        {proof.uploadedBy.person.lastName}
                      </ThemedText>
                    )}
                  </ThemedView>

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
                </ThemedView>
              </ThemedView>
            ))}

            {/* Upload new proof */}
            {canUploadProof && (
              <ThemedView style={tw`gap-3`}>
                {selectedImage ? (
                  <ThemedView style={tw`gap-3`}>
                    <Pressable onPress={() => openPreview(proofs.length)}>
                      <ThemedView
                        style={tw`rounded-xl border border-gray-200 overflow-hidden relative`}
                      >
                        <Image
                          source={{ uri: selectedImage.uri }}
                          style={tw`w-full h-32`}
                          resizeMode="cover"
                        />
                        <Pressable
                          onPress={() => setSelectedImage(null)}
                          style={tw`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center`}
                        >
                          <Icon name="x" size={18} color="white" />
                        </Pressable>
                      </ThemedView>
                    </Pressable>
                    <Button
                      label={t("common:actions.upload")}
                      onPress={handleUploadProof}
                      loading={isUploading}
                      disabled={isUploading}
                    />
                  </ThemedView>
                ) : (
                  <ThemedView style={tw`flex-row gap-3`}>
                    <Pressable
                      onPress={() => pickImage("gallery")}
                      style={({ pressed }) => [
                        tw`flex-1 items-center justify-center p-3 rounded-xl border border-gray-200 bg-surface-bright gap-2`,
                        pressed && tw`opacity-70 bg-gray-50`,
                      ]}
                    >
                      <Icon
                        name="images"
                        size={20}
                        color={tw.color("gray-500")}
                      />
                      <ThemedText
                        type="small"
                        style={tw`text-gray-500 text-center`}
                      >
                        {t("bills:proofUpload.fromGallery")}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => pickImage("camera")}
                      style={({ pressed }) => [
                        tw`flex-1 items-center justify-center p-3 rounded-xl border border-gray-200 bg-surface-bright gap-2`,
                        pressed && tw`opacity-70 bg-gray-50`,
                      ]}
                    >
                      <Icon
                        name="camera"
                        size={20}
                        color={tw.color("gray-500")}
                      />
                      <ThemedText
                        type="small"
                        style={tw`text-gray-500 text-center`}
                      >
                        {t("bills:proofUpload.fromCamera")}
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Floating Actions */}
      {isTransfer &&
        canManage &&
        (canApproveTransaction || canRejectTransaction) && (
          <View style={tw`absolute bottom-6 left-4 right-4`}>
            <ThemedView
              style={tw`flex-row gap-3 bg-surface rounded-3xl p-2 shadow-sm`}
            >
              {canRejectTransaction && (
                <Button
                  label={t("common:actions.reject")}
                  leftIcon="x"
                  variant="destructive"
                  onPress={handleRejectTransaction}
                  loading={isRejecting}
                  disabled={isRejecting}
                  style={tw`flex-1`}
                />
              )}
              {canApproveTransaction && (
                <Button
                  label={t("common:actions.approve")}
                  leftIcon="check"
                  variant="primary"
                  onPress={openApproveModal}
                  style={tw`flex-1`}
                />
              )}
            </ThemedView>
          </View>
        )}

      <ApproveTransactionModal
        transaction={transaction}
        visible={approveModalIsOpen}
        onClose={closeApproveModal}
        onApproved={handleTransactionApproved}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <ThemedView style={tw`flex-1 bg-black`}>
          <ThemedView
            style={tw`absolute top-0 left-0 right-0 z-10 px-4 pt-12 pb-4 flex-row justify-between items-center`}
          >
            <ThemedText type="body1" style={tw`text-white font-semibold`}>
              {previewIndex + 1} / {allPreviewImages.length}
            </ThemedText>
            <Pressable onPress={() => setPreviewVisible(false)} hitSlop={8}>
              <Icon name="x" size={28} color="white" />
            </Pressable>
          </ThemedView>
          <ImageViewer
            imageUrls={allPreviewImages}
            index={previewIndex}
            onSwipeDown={() => setPreviewVisible(false)}
            enableSwipeDown={true}
            enableImageZoom={true}
            saveToLocalByLongPress={false}
            backgroundColor="black"
            renderIndicator={() => <></>}
          />
        </ThemedView>
      </Modal>

      {/* Account Picker Bottom Sheet */}
      <BottomSheetPicker
        ref={accountBottomSheetRef}
        title={t("bills:account.destinationAccount")}
        options={allowedAccounts.map((account) => ({
          label: account.num ? `${account.name} #${account.num}` : account.name,
          value: account.id,
        }))}
        value={transaction?.account?.id}
        onChange={handleChangeAccount}
      />
    </Container>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <ThemedView style={tw`flex-row items-center gap-4`}>
      <Icon
        name={icon}
        size={18}
        color={tw.color("text-on-surface")}
      />
      <ThemedView style={tw`flex-1 gap-1`}>
        <ThemedText type="body1" style={tw`text-on-surface`}>
          {label}
        </ThemedText>
        <ThemedText type="body2" style={tw` text-gray-800`}>
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
    { bg: string; text: string; label: string; icon: IconName }
  > = {
    [TransactionStatus.COMPLETED]: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: t("common:transactions.status.completed"),
      icon: "circle-check",
    },
    [TransactionStatus.PENDING_PROOF]: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: t("common:transactions.status.pendingProof"),
      icon: "file-up",
    },
    [TransactionStatus.PENDING_APPROVAL]: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: t("common:transactions.status.pendingApproval"),
      icon: "clock",
    },
    [TransactionStatus.REJECTED]: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: t("common:transactions.status.rejected"),
      icon: "circle-x",
    },
    [TransactionStatus.CANCELLED]: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: t("common:transactions.status.cancelled"),
      icon: "ban",
    },
  };

  const c = config[status] || config[TransactionStatus.COMPLETED];

  return (
    <ThemedView
      style={tw`flex-row items-center gap-1 px-3 py-1 rounded-full ${c.bg}`}
    >
      <Icon
        name={c.icon}
        size={14}
        color={tw.color(c.text.replace("text-", "").replace("-700", "-600"))}
      />
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
    <ThemedView style={tw`px-2 py-0.5 rounded-full ${c.bg}`}>
      <ThemedText type="small" style={tw`${c.text} font-medium`}>
        {c.label}
      </ThemedText>
    </ThemedView>
  );
}
