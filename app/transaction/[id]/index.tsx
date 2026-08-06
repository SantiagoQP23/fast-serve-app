import React, { useState, useRef, useCallback } from "react";
import { ScrollView, Image, Alert, Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatCurrency } from "@/core/i18n/utils";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/presentation/theme/components/button";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  useTransaction,
  useUpdateTransaction,
  useApproveTransaction,
  useRejectTransaction,
} from "@/presentation/transactions/hooks/useTransaction";
import { PaymentProofStatus } from "@/core/transactions/models/payment-proof.model";
import { TransactionStatus } from "@/core/transactions/models/transaction-status.enum";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { AccountType } from "@/core/restaurant/models/account.model";
import { usePaymentMethodsStore } from "@/presentation/restaurant/store/usePaymentMethodsStore";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { PaymentProofsService } from "@/core/transactions/services/payment-proofs.service";
import ImageViewer from "react-native-image-zoom-viewer";
import { Modal } from "react-native";

export default function TransactionDetailScreen() {
  const { t } = useTranslation(["common", "bills"]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);

  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === "admin";
  const isCashier = user?.role?.name === "cashier";
  const canManage = isAdmin || isCashier;

  const { transaction, isLoading, refetch } = useTransaction(transactionId);
  const { updateTransaction, isLoading: isUpdating } = useUpdateTransaction();
  const { approveTransaction, isLoading: isApproving } =
    useApproveTransaction();
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

  const accountBottomSheetRef = useRef<BottomSheetModal>(null);
  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 50,
    stiffness: 300,
    mass: 1,
    overshootClamping: true,
  });

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
      Alert.alert(
        t("common:status.success"),
        t("bills:proofUpload.uploadSuccess"),
      );
      refetch();
      refetchProofs();
    } catch (error: any) {
      Alert.alert(
        t("errors:general.error"),
        error?.response?.data?.message ||
          error?.message ||
          t("errors:general.unknownError"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveTransaction = useCallback(() => {
    Alert.alert(
      t("bills:proofUpload.approveTitle"),
      t("bills:proofUpload.approveMessage"),
      [
        { text: t("common:actions.cancel"), style: "cancel" },
        {
          text: t("common:actions.approve"),
          style: "default",
          onPress: () => {
            approveTransaction(transactionId, {
              onSuccess: () => {
                refetch();
                Alert.alert(
                  t("common:status.success"),
                  t("common:transactions.status.completed"),
                );
              },
            });
          },
        },
      ],
    );
  }, [approveTransaction, transactionId, refetch, t]);

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
                  Alert.alert(
                    t("common:status.success"),
                    t("common:transactions.status.rejected"),
                  );
                },
              },
            );
          },
        },
      ],
    );
  }, [rejectTransaction, transactionId, rejectReason, refetch, t]);

  const handleChangeAccount = (accountId: number) => {
    updateTransaction(
      { id: transactionId, data: { accountId } },
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
      <ScreenLayout style={tw`flex-1 justify-center items-center`}>
        <ThemedText type="body2" style={tw`text-gray-400`}>
          {t("common:status.loading")}
        </ThemedText>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1`}>
      {/* Header */}
      <ThemedView style={tw`px-4 pt-4 pb-2 flex-row items-center gap-3`}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={tw.color("gray-700")}
          />
        </Pressable>
        <ThemedText type="h3" style={tw`font-bold flex-1`}>
          {t("common:navigation.incomes")}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-2 pb-8 gap-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Amount */}
        <ThemedView style={tw`items-center gap-2`}>
          <ThemedText
            type="body1"
            style={tw`font-semibold text-gray-600 text-center`}
          >
            {transaction.name}
          </ThemedText>
          <ThemedText style={tw`text-4xl font-bold`}>
            {formatCurrency(transaction.amount)}
          </ThemedText>
          <StatusBadge status={transaction.status} />
        </ThemedView>

        {/* Details */}
        <ThemedView style={tw`gap-4`}>
          <DetailRow
            icon="wallet-outline"
            label={t("common:transactions.paymentMethod")}
            value={transaction.paymentMethod.name}
          />

          {/* Account - editable for admin/cashier */}
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <Ionicons
              name="business-outline"
              size={18}
              color={tw.color("gray-400")}
            />
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("common:transactions.account")}
              </ThemedText>
              <ThemedText type="body2" style={tw`font-medium text-gray-800`}>
                {transaction.account.name}
                {transaction.account.num ? ` #${transaction.account.num}` : ""}
              </ThemedText>
            </ThemedView>
            {canManage && (
              <Pressable onPress={openAccountPicker} hitSlop={8}>
                <ThemedText
                  type="body2"
                  style={tw`text-light-primary font-medium`}
                >
                  {t("common:actions.edit")}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

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
          <DetailRow
            icon="calendar-outline"
            label={t("common:labels.date")}
            value={new Date(transaction.createdAt).toLocaleDateString()}
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
                style={tw`rounded-xl border border-gray-200 overflow-hidden`}
              >
                <Pressable onPress={() => openPreview(index)}>
                  <Image
                    source={{ uri: proof.fileUrl }}
                    style={tw`w-full h-56`}
                    resizeMode="cover"
                  />
                </Pressable>
                <ThemedView style={tw`p-4 gap-2`}>
                  <ThemedText
                    type="small"
                    style={tw`text-gray-400 text-center`}
                  >
                    {t("common:actions.tapToPreview")}
                  </ThemedText>
                  <ThemedView style={tw`flex-row items-center gap-2`}>
                    <ProofStatusBadge status={proof.status} />
                    <ThemedText type="small" style={tw`text-gray-500`}>
                      {new Date(proof.createdAt).toLocaleDateString()}
                    </ThemedText>
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
                </ThemedView>
              </ThemedView>
            ))}

            {/* Upload new proof */}
            {canUploadProof && (
              <ThemedView style={tw`gap-3`}>
                <ThemedText type="body2" style={tw`text-gray-500`}>
                  {t("bills:proofUpload.uploadTitle")}
                </ThemedText>

                {selectedImage ? (
                  <ThemedView style={tw`gap-3`}>
                    <Pressable onPress={() => openPreview(proofs.length)}>
                      <ThemedView
                        style={tw`rounded-xl border border-gray-200 overflow-hidden`}
                      >
                        <Image
                          source={{ uri: selectedImage.uri }}
                          style={tw`w-full h-32`}
                          resizeMode="cover"
                        />
                      </ThemedView>
                      <ThemedText
                        type="small"
                        style={tw`text-gray-400 text-center mt-1`}
                      >
                        {t("common:actions.tapToPreview")}
                      </ThemedText>
                    </Pressable>
                    <ThemedView style={tw`flex-row gap-3`}>
                      <Button
                        label={t("common:actions.change")}
                        variant="outline"
                        onPress={() => setSelectedImage(null)}
                        style={tw`flex-1`}
                      />
                      <Button
                        label={t("common:actions.upload")}
                        onPress={handleUploadProof}
                        loading={isUploading}
                        disabled={isUploading}
                        style={tw`flex-1`}
                      />
                    </ThemedView>
                  </ThemedView>
                ) : (
                  <ThemedView style={tw`flex-row gap-3`}>
                    <Pressable
                      onPress={() => pickImage("gallery")}
                      style={({ pressed }) => [
                        tw`flex-1 items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 gap-2`,
                        pressed && tw`opacity-70 bg-gray-100`,
                      ]}
                    >
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color={tw.color("gray-400")}
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
                        tw`flex-1 items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 gap-2`,
                        pressed && tw`opacity-70 bg-gray-100`,
                      ]}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color={tw.color("gray-400")}
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

      {/* Bottom Actions */}
      {isTransfer && (
        <ThemedView style={tw`px-4 pb-6 pt-4 border-t border-gray-200 gap-3`}>
          {/* Transaction-level admin actions */}
          {canManage && (
            <>
              {canApproveTransaction && (
                <Button
                  label={t("common:actions.approve")}
                  onPress={handleApproveTransaction}
                  loading={isApproving}
                  disabled={isApproving || isRejecting}
                />
              )}
              {canRejectTransaction && (
                <>
                  {showRejectInput && (
                    <>
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {t("bills:proofUpload.rejectReasonPlaceholder")}
                      </ThemedText>
                      <ThemedView
                        style={tw`border border-gray-300 rounded-xl p-3 bg-white`}
                      >
                        <ThemedText
                          type="body2"
                          style={tw`text-gray-800`}
                          selectable
                        >
                          {rejectReason || " "}
                        </ThemedText>
                      </ThemedView>
                    </>
                  )}
                  <Button
                    label={t("common:actions.reject")}
                    variant="outline"
                    onPress={handleRejectTransaction}
                    loading={isRejecting}
                    disabled={isApproving || isRejecting}
                  />
                </>
              )}
            </>
          )}
        </ThemedView>
      )}

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
              <Ionicons name="close-outline" size={28} color="white" />
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
      <BottomSheetModal
        ref={accountBottomSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        <BottomSheetView style={tw`flex-1 px-4 pt-4 pb-8`}>
          <ThemedText type="h4" style={tw`font-bold mb-4`}>
            {t("bills:account.destinationAccount")}
          </ThemedText>
          <ThemedView style={tw`gap-3`}>
            {allowedAccounts.map((account) => {
              const isSelected = account.id === transaction?.account?.id;
              return (
                <Pressable
                  key={account.id}
                  onPress={() => handleChangeAccount(account.id)}
                  disabled={isUpdating}
                  style={({ pressed }) => [
                    tw`flex-row items-center px-4 py-3 rounded-xl border border-gray-200 gap-3`,
                    pressed && tw`opacity-80`,
                    isSelected && tw`border-light-primary bg-gray-100`,
                  ]}
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
                  <ThemedView style={tw`flex-1`}>
                    <ThemedText type="body2" style={tw`font-medium`}>
                      {account.name}
                    </ThemedText>
                    {account.num && (
                      <ThemedText type="small" style={tw`text-gray-500`}>
                        {account.num}
                      </ThemedText>
                    )}
                  </ThemedView>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={tw.color("green-500")}
                    />
                  )}
                </Pressable>
              );
            })}
          </ThemedView>
        </BottomSheetView>
      </BottomSheetModal>
    </ScreenLayout>
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
    <ThemedView
      style={tw`flex-row items-center gap-1 px-3 py-1 rounded-full ${c.bg}`}
    >
      <Ionicons
        name={c.icon as any}
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
