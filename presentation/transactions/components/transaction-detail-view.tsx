import { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  Image,
  Alert,
  Linking,
  Pressable,
  View,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";
import { formatCurrency } from "@/core/i18n/utils";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import InfoRow from "@/presentation/theme/components/info-row";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import {
  useTransaction,
  useUpdateTransaction,
} from "@/presentation/transactions/hooks/useTransaction";
import {
  PaymentProofStatus,
  type PaymentProof,
} from "@/core/transactions/models/payment-proof.model";
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
import RejectTransactionSheet, {
  type RejectTransactionSheetRef,
} from "@/presentation/transactions/components/reject-transaction-sheet";
import InfoBottomSheet from "@/presentation/theme/components/info-bottom-sheet";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import BillLoadState from "@/presentation/orders/components/bill-load-state";
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

const DATE_FORMAT = "DD MMM YYYY, HH:mm";

const transactionStatusLabel: Record<
  TransactionStatus,
  { color: LabelProps["color"]; icon: IconName; key: string }
> = {
  [TransactionStatus.COMPLETED]: {
    color: "success",
    icon: "circle-check",
    key: "completed",
  },
  [TransactionStatus.PENDING_PROOF]: {
    color: "warning",
    icon: "file-up",
    key: "pendingProof",
  },
  [TransactionStatus.PENDING_APPROVAL]: {
    color: "warning",
    icon: "clock",
    key: "pendingApproval",
  },
  [TransactionStatus.REJECTED]: {
    color: "error",
    icon: "circle-x",
    key: "rejected",
  },
  [TransactionStatus.CANCELLED]: {
    color: "default",
    icon: "ban",
    key: "cancelled",
  },
};

const proofStatusLabel: Record<
  PaymentProofStatus,
  { color: LabelProps["color"]; key: string }
> = {
  [PaymentProofStatus.PENDING]: { color: "warning", key: "pending" },
  [PaymentProofStatus.APPROVED]: { color: "success", key: "approved" },
  [PaymentProofStatus.REJECTED]: { color: "error", key: "rejected" },
};

const paymentMethodIcon: Partial<Record<PaymentMethodCategory, IconName>> = {
  [PaymentMethodCategory.CASH]: "banknote",
  [PaymentMethodCategory.CARD]: "credit-card",
  [PaymentMethodCategory.TRANSFER]: "landmark",
  [PaymentMethodCategory.DIGITAL_WALLET]: "smartphone",
};

const personName = (person?: { firstName: string; lastName: string }) =>
  person ? `${person.firstName} ${person.lastName}`.trim() : "";

export default function TransactionDetailView({
  transactionId,
  embedded = false,
  onClose,
}: TransactionDetailViewProps) {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const Container = embedded ? ThemedView : ScreenLayout;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();
  const isAdmin = isAdminLevelRole(user?.role?.name);
  const isCashier = user?.role?.name === Roles.CASHIER;
  const canManage = isAdmin || isCashier;

  const { transaction, isLoading, error, refetch } =
    useTransaction(transactionId);
  const { updateTransaction } = useUpdateTransaction();

  const { paymentMethods } = usePaymentMethodsStore();
  const paymentMethod = transaction
    ? paymentMethods.find((pm) => pm.id === transaction.paymentMethod.id)
    : null;
  const allowedAccounts = paymentMethod?.allowedDestinationAccounts ?? [];

  const { proofs, refetchProofs } = usePaymentProofs(transactionId);

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const accountBottomSheetRef = useRef<BottomSheetPickerRef>(null);
  const rejectSheetRef = useRef<RejectTransactionSheetRef>(null);
  const accountLockedSheetRef = useRef<BottomSheetMethods>(null);

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

  const hasActionBar = canApproveTransaction || canRejectTransaction;

  // Approving a transfer records the money in its account, so from then on
  // only admins and owners can move it; a cancelled payment can't change.
  const accountLockReason: "approved" | "cancelled" | null =
    transaction?.status === TransactionStatus.CANCELLED
      ? "cancelled"
      : isTransfer &&
          transaction?.status === TransactionStatus.COMPLETED &&
          !isAdmin
        ? "approved"
        : null;

  const canChangeAccount =
    canManage && allowedAccounts.length > 0 && !accountLockReason;

  const pickImage = async (source: "camera" | "gallery") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        t("errors:general.permissionDenied"),
        source === "camera"
          ? t("bills:proofUpload.cameraPermissionRequired")
          : t("bills:proofUpload.galleryPermissionRequired"),
        [
          { text: t("common:actions.cancel"), style: "cancel" },
          {
            text: t("bills:proofUpload.openSettings"),
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedImage || !transaction) return;

    setIsUploading(true);
    try {
      await PaymentProofsService.uploadProof(
        transaction.id,
        selectedImage.uri,
        selectedImage.fileName || "proof.jpg",
        selectedImage.mimeType || "image/jpeg",
      );
      setSelectedImage(null);
      toast.success(t("bills:proofUpload.uploadSuccess"));
      refetch();
      refetchProofs();
    } catch (err) {
      toast.error(getErrorMessage(err, { fallbackToServerMessage: true }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewed = useCallback(() => {
    refetch();
    refetchProofs();
  }, [refetch, refetchProofs]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // refetch() resolves even when the request fails; the transaction
      // already on screen stays, so a toast says it may be out of date.
      const [result] = await Promise.all([refetch(), refetchProofs()]);
      if (result.isError)
        toast.error(t("common:transactions.loadState.errorTitle"));
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchProofs, t]);

  const handleChangeAccount = (accountId: string | number) => {
    if (Number(accountId) === transaction?.account?.id) {
      accountBottomSheetRef.current?.dismiss();
      return;
    }
    updateTransaction(
      { id: transactionId, data: { accountId: Number(accountId) } },
      {
        onSuccess: () => {
          accountBottomSheetRef.current?.dismiss();
          toast.success(t("common:transactions.accountUpdated"));
          refetch();
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, { fallbackToServerMessage: true }));
        },
      },
    );
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

  // Close the viewer before opening the next layer: stacked native modals
  // don't present reliably on Android.
  const approveFromPreview = () => {
    setPreviewVisible(false);
    openApproveModal();
  };
  const rejectFromPreview = () => {
    setPreviewVisible(false);
    rejectSheetRef.current?.present();
  };

  if (!transaction) {
    return (
      <Container style={tw`flex-1 bg-background`}>
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
        <BillLoadState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          icon={error ? undefined : "receipt-text"}
          title={
            isLoading
              ? undefined
              : error && (error as any)?.response?.status !== 404
                ? t("common:transactions.loadState.errorTitle")
                : t("common:transactions.loadState.notFoundTitle")
          }
          description={
            isLoading
              ? undefined
              : error && (error as any)?.response?.status !== 404
                ? t("common:transactions.loadState.errorDescription")
                : t("common:transactions.loadState.notFoundDescription")
          }
        />
      </Container>
    );
  }

  const status =
    transactionStatusLabel[transaction.status] ??
    transactionStatusLabel[TransactionStatus.COMPLETED];
  const accountLabel = transaction.account
    ? transaction.account.num
      ? `${transaction.account.name} #${transaction.account.num}`
      : transaction.account.name
    : undefined;
  const metadata = transaction.metadata;
  const latestProof = proofs[0];
  const previousProofs = proofs.slice(1);

  // Settled (approved or cancelled) with no proof: nothing is missing anymore.
  const isSettled =
    transaction.status === TransactionStatus.COMPLETED ||
    transaction.status === TransactionStatus.CANCELLED;

  const proofHint = !latestProof
    ? isSettled
      ? null
      : canUploadProof
        ? t("bills:proofUpload.noProofHint")
        : t("bills:proofUpload.noProofHintManager")
    : latestProof.status === PaymentProofStatus.REJECTED && canUploadProof
      ? t("bills:proofUpload.rejectedHint")
      : latestProof.status === PaymentProofStatus.PENDING && !canManage
        ? t("bills:proofUpload.awaitingReviewHint")
        : null;

  const proofMeta = (proof: PaymentProof) =>
    t("bills:proofUpload.uploadedByOn", {
      name:
        personName(proof.uploadedBy?.person) ||
        t("common:labels.deletedUser"),
      date: dayjs(proof.createdAt).format(DATE_FORMAT),
    });

  const accountRow = (
    <InfoRow
      label={t("common:transactions.destinationAccount")}
      value={accountLabel}
      onPress={
        canChangeAccount
          ? () => accountBottomSheetRef.current?.present()
          : undefined
      }
      trailing={
        canManage && accountLockReason ? (
          <IconButton
            icon="info"
            size={20}
            onPress={() => accountLockedSheetRef.current?.present()}
            accessibilityLabel={t(
              "common:transactions.accountLocked.infoLabel",
            )}
            style={tw`-my-3`}
          />
        ) : undefined
      }
    />
  );

  const viewedProof = proofs[previewIndex];
  const viewedProofStatus = viewedProof
    ? proofStatusLabel[viewedProof.status]
    : null;

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
        contentContainerStyle={[
          tw`px-4 pt-2 gap-8`,
          // Keep the last row clear of the docked action bar.
          { paddingBottom: hasActionBar ? 128 : 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tw.color("primary") ?? ""]}
            tintColor={tw.color("primary")}
          />
        }
      >
        {/* Amount: what the cashier checks the proof against */}
        <ThemedView style={tw`gap-3`}>
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="caption" style={tw`text-gray-500`}>
              {transaction.name}
            </ThemedText>
            <ThemedText
              type="h1"
              // h1 fixes its height for 32px text; size the box for 48px.
              style={[
                tw`text-5xl`,
                { fontFamily: typography.regular, lineHeight: 58, height: 58 },
              ]}
            >
              {formatCurrency(transaction.amount)}
            </ThemedText>
          </ThemedView>
          <ThemedView style={tw`flex-row flex-wrap items-center gap-2`}>
            <Label
              size="small"
              color={status.color}
              leftIcon={status.icon}
              text={t(`common:transactions.status.${status.key}`)}
            />
            <Label
              size="small"
              color="default"
              leftIcon={
                paymentMethodIcon[transaction.paymentMethod.type] ?? "wallet"
              }
              text={transaction.paymentMethod.name}
            />
          </ThemedView>
        </ThemedView>

        {/* Proof: the thing being verified, shown big enough to read */}
        {isTransfer && (
          <ThemedView style={tw`gap-4`}>
            <SectionTitle title={t("bills:proofUpload.proof")} />

            {latestProof ? (
              <ThemedView style={tw`gap-2`}>
                <Pressable
                  onPress={() => openPreview(0)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${t("bills:proofUpload.viewProof")}, ${t(
                    `common:status.${proofStatusLabel[latestProof.status].key}`,
                  )}`}
                  style={({ pressed }) => [
                    tw`rounded-md overflow-hidden bg-surface`,
                    pressed && tw`opacity-80`,
                  ]}
                >
                  <Image
                    source={{ uri: latestProof.fileUrl }}
                    style={tw`w-full h-96`}
                    resizeMode="contain"
                  />
                  <View style={tw`absolute top-3 left-3`}>
                    <Label
                      size="small"
                      color={proofStatusLabel[latestProof.status].color}
                      text={t(
                        `common:status.${proofStatusLabel[latestProof.status].key}`,
                      )}
                    />
                  </View>
                  <View
                    style={tw`absolute bottom-3 right-3 p-2 rounded-md bg-background`}
                  >
                    <Icon
                      name="maximize-2"
                      size={18}
                      color={tw.color("text")}
                    />
                  </View>
                </Pressable>
                <ProofNotes proof={latestProof} meta={proofMeta(latestProof)} />
              </ThemedView>
            ) : (
              <ThemedView
                style={tw`items-center gap-2 px-6 py-8 rounded-md bg-surface`}
              >
                <Icon name="image" size={32} color={tw.color("gray-500")} />
                <ThemedText type="h4" style={tw`text-center`}>
                  {isSettled
                    ? t("bills:proofUpload.noProofSettled")
                    : t("bills:proofUpload.noProofTitle")}
                </ThemedText>
              </ThemedView>
            )}

            {proofHint && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {proofHint}
              </ThemedText>
            )}

            {/* Upload: a picked image waits here until it's sent */}
            {canUploadProof &&
              (selectedImage ? (
                <ThemedView style={tw`gap-3`}>
                  <Pressable
                    onPress={() => openPreview(proofs.length)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={t("bills:proofUpload.viewProof")}
                    style={tw`rounded-md overflow-hidden bg-surface`}
                  >
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={tw`w-full h-64`}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <ThemedView style={tw`flex-row gap-3`}>
                    <Button
                      label={t("bills:proofUpload.removeSelected")}
                      variant="outline"
                      onPress={() => setSelectedImage(null)}
                      disabled={isUploading}
                      style={tw`flex-1`}
                    />
                    <Button
                      label={t("bills:proofUpload.uploadProof")}
                      leftIcon="upload"
                      onPress={handleUploadProof}
                      loading={isUploading}
                      disabled={isUploading}
                      style={{ flexGrow: 2, flexShrink: 1, flexBasis: 0 }}
                    />
                  </ThemedView>
                </ThemedView>
              ) : (
                <ThemedView style={tw`gap-2`}>
                  {latestProof && (
                    <ThemedText type="small">
                      {t("bills:proofUpload.uploadAnother")}
                    </ThemedText>
                  )}
                  <ThemedView style={tw`flex-row gap-3`}>
                    <Button
                      label={t("bills:proofUpload.fromGallery")}
                      leftIcon="images"
                      variant="outline"
                      onPress={() => pickImage("gallery")}
                      style={tw`flex-1`}
                    />
                    <Button
                      label={t("bills:proofUpload.fromCamera")}
                      leftIcon="camera"
                      variant="outline"
                      onPress={() => pickImage("camera")}
                      style={tw`flex-1`}
                    />
                  </ThemedView>
                </ThemedView>
              ))}

            {/* What to match the proof against */}
            <ThemedView>
              {metadata?.type === "TRANSFER" && metadata.bankReference ? (
                <DetailRow
                  label={t("bills:proofUpload.bankReference")}
                  value={metadata.bankReference}
                />
              ) : null}
              {metadata?.type === "TRANSFER" && metadata.senderName ? (
                <DetailRow
                  label={t("bills:proofUpload.senderName")}
                  value={metadata.senderName}
                />
              ) : null}
              {accountRow}
            </ThemedView>

            {previousProofs.length > 0 && (
              <ThemedView style={tw`gap-1`}>
                <ThemedText type="small">
                  {t("bills:proofUpload.previousProofs")}
                </ThemedText>
                {previousProofs.map((proof, i) => {
                  const proofStatus = proofStatusLabel[proof.status];
                  return (
                    <Pressable
                      key={proof.id}
                      onPress={() => openPreview(i + 1)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`${t("bills:proofUpload.viewProof")}, ${t(
                        `common:status.${proofStatus.key}`,
                      )}, ${proofMeta(proof)}`}
                      style={({ pressed }) => [
                        tw`flex-row gap-3 py-3 border-b border-divider`,
                        pressed && tw`opacity-60`,
                      ]}
                    >
                      <Image
                        source={{ uri: proof.fileUrl }}
                        style={tw`w-14 h-14 rounded-md bg-surface`}
                        resizeMode="cover"
                      />
                      <ThemedView style={tw`flex-1 gap-1 items-start`}>
                        <Label
                          size="small"
                          color={proofStatus.color}
                          text={t(`common:status.${proofStatus.key}`)}
                        />
                        <ProofNotes proof={proof} meta={proofMeta(proof)} />
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            )}
          </ThemedView>
        )}

        {/* Details */}
        <ThemedView>
          <SectionTitle title={t("common:transactions.details")} />
          {transaction.bill && (
            <DetailRow
              label={t("common:transactions.bill")}
              value={t("common:transactions.billNumber", {
                num: transaction.bill.num,
              })}
              onPress={() => router.push(`/(bills)/${transaction.bill!.id}`)}
            />
          )}
          {!isTransfer && accountRow}
          {metadata?.type === "CARD" && (
            <DetailRow
              label={t("common:transactions.totalWithCommission")}
              value={formatCurrency(metadata.totalWithCommission)}
            />
          )}
          {metadata?.type === "CASH" && metadata.cashReceived != null && (
            <DetailRow
              label={t("common:transactions.cashReceived")}
              value={formatCurrency(metadata.cashReceived)}
            />
          )}
          {metadata?.type === "CASH" && metadata.changeGiven != null && (
            <DetailRow
              label={t("common:transactions.changeGiven")}
              value={formatCurrency(metadata.changeGiven)}
            />
          )}
          <DetailRow
            label={t("common:transactions.category")}
            value={transaction.category.name}
          />
          <DetailRow
            label={t("common:transactions.createdBy")}
            value={getUserDisplayName(
              transaction.createdBy,
              t("common:labels.deletedUser"),
            )}
          />
          <DetailRow
            label={t("common:labels.date")}
            value={dayjs(transaction.createdAt).format(DATE_FORMAT)}
          />
          {!!transaction.description && (
            <DetailRow
              label={t("common:transactions.description")}
              value={transaction.description}
            />
          )}
        </ThemedView>
      </ScrollView>

      {/* Review bar: the screen's one decision, in thumb reach */}
      {hasActionBar && (
        <ThemedView
          style={[
            tw`absolute bottom-0 left-0 right-0 flex-row gap-3 bg-background border-t border-divider px-4 pt-3`,
            { paddingBottom: embedded ? 16 : Math.max(insets.bottom, 16) },
          ]}
        >
          {canRejectTransaction && (
            <Button
              label={t("common:actions.reject")}
              variant="outline"
              onPress={() => rejectSheetRef.current?.present()}
              style={tw`flex-1`}
            />
          )}
          {canApproveTransaction && (
            <Button
              label={t("common:actions.approve")}
              leftIcon="check"
              onPress={openApproveModal}
              style={{ flexGrow: 2, flexShrink: 1, flexBasis: 0 }}
            />
          )}
        </ThemedView>
      )}

      <ApproveTransactionModal
        transaction={transaction}
        visible={approveModalIsOpen}
        onClose={closeApproveModal}
        onApproved={handleReviewed}
      />

      <RejectTransactionSheet
        ref={rejectSheetRef}
        transactionId={transactionId}
        onRejected={handleReviewed}
      />

      {/* Proof viewer. Photos sit on black in every theme, like the system
          gallery, so the colors here are fixed rather than themed. */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={tw`flex-1 bg-black`}>
          <ImageViewer
            imageUrls={allPreviewImages}
            index={previewIndex}
            onChange={(index) => setPreviewIndex(index ?? 0)}
            onSwipeDown={() => setPreviewVisible(false)}
            enableSwipeDown={true}
            enableImageZoom={true}
            saveToLocalByLongPress={false}
            backgroundColor="black"
            renderIndicator={() => <></>}
          />

          <View
            style={[
              tw`absolute top-0 left-0 right-0 px-2 flex-row justify-between items-center`,
              { paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.6)" },
            ]}
          >
            <ThemedText
              type="body1"
              style={[tw`px-2 text-white`, { fontFamily: typography.semibold }]}
            >
              {previewIndex + 1} / {allPreviewImages.length}
            </ThemedText>
            <Pressable
              onPress={() => setPreviewVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t("common:actions.close")}
              style={tw`w-12 h-12 items-center justify-center`}
            >
              <Icon name="x" size={26} color="white" />
            </Pressable>
          </View>

          {/* Expected amount next to the proof, so nothing is held in memory */}
          <View
            style={[
              tw`absolute bottom-0 left-0 right-0 px-4 pt-4 gap-3`,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                backgroundColor: "rgba(0,0,0,0.6)",
              },
            ]}
          >
            <View style={tw`flex-row items-end justify-between gap-3`}>
              <View style={tw`flex-1 gap-1`}>
                <ThemedText type="small" style={tw`text-white opacity-70`}>
                  {t("bills:proofUpload.expectedAmount")}
                </ThemedText>
                <ThemedText
                  type="h3"
                  style={[tw`text-white`, { fontFamily: typography.semibold }]}
                >
                  {formatCurrency(transaction.amount)}
                </ThemedText>
                {accountLabel && (
                  <ThemedText type="small" style={tw`text-white opacity-70`}>
                    {accountLabel}
                  </ThemedText>
                )}
              </View>
              {viewedProofStatus && (
                <Label
                  size="small"
                  color={viewedProofStatus.color}
                  text={t(`common:status.${viewedProofStatus.key}`)}
                />
              )}
            </View>
            {hasActionBar && viewedProof && (
              <View style={tw`flex-row gap-3`}>
                {canRejectTransaction && (
                  <Button
                    label={t("common:actions.reject")}
                    variant="surface"
                    onPress={rejectFromPreview}
                    style={tw`flex-1`}
                  />
                )}
                {canApproveTransaction && (
                  <Button
                    label={t("common:actions.approve")}
                    leftIcon="check"
                    onPress={approveFromPreview}
                    style={{ flexGrow: 2, flexShrink: 1, flexBasis: 0 }}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <InfoBottomSheet
        ref={accountLockedSheetRef}
        title={t("common:transactions.accountLocked.title")}
        message={
          accountLockReason
            ? t(`common:transactions.accountLocked.${accountLockReason}`, {
                account: accountLabel,
              })
            : ""
        }
      />

      <BottomSheetPicker
        ref={accountBottomSheetRef}
        title={t("bills:account.destinationAccount")}
        options={allowedAccounts.map((account) => ({
          label: account.num ? `${account.name} #${account.num}` : account.name,
          value: account.id,
        }))}
        value={transaction.account?.id}
        onChange={handleChangeAccount}
      />
    </Container>
  );
}

/** Who sent a proof and when, plus the reviewer's verdict if there is one. */
function ProofNotes({ proof, meta }: { proof: PaymentProof; meta: string }) {
  const { t } = useTranslation(["bills"]);
  const reviewer = personName(proof.reviewedBy?.person);

  return (
    <ThemedView style={tw`gap-1`}>
      <ThemedText type="small" style={tw`text-gray-500`}>
        {meta}
      </ThemedText>
      {!!proof.rejectionReason && (
        <ThemedText type="body2" style={tw`text-red-700`}>
          {t("bills:proofUpload.rejectionReason")}: {proof.rejectionReason}
        </ThemedText>
      )}
      {!!proof.notes && (
        <ThemedText type="body2">
          {t("bills:proofUpload.approvalNotes")}: {proof.notes}
        </ThemedText>
      )}
      {!!reviewer && proof.status !== PaymentProofStatus.PENDING && (
        <ThemedText type="small" style={tw`text-gray-500`}>
          {t("bills:proofUpload.reviewedBy", { name: reviewer })}
        </ThemedText>
      )}
    </ThemedView>
  );
}

/** Section heading, matching the restaurant info screen. */
function SectionTitle({ title }: { title: string }) {
  return (
    <ThemedText
      type="body1"
      accessibilityRole="header"
      style={[tw`text-primary`, { fontFamily: typography.semibold }]}
    >
      {title}
    </ThemedText>
  );
}

/**
 * Label stacked over its value, as on the restaurant info screen. Values are
 * selectable so a reference can be copied; `onPress` adds a chevron.
 */
function DetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <ThemedView style={tw`flex-row items-center gap-3 min-h-16`}>
      <ThemedView style={tw`flex-1 gap-0.5`}>
        <ThemedText type="small">{label}</ThemedText>
        <ThemedText selectable={!onPress}>{value}</ThemedText>
      </ThemedView>
      {onPress && <Icon name="chevron-right" size={18} />}
    </ThemedView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        style={({ pressed }) => [pressed && tw`opacity-60`]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <ThemedView accessible accessibilityLabel={`${label}, ${value}`}>
      {content}
    </ThemedView>
  );
}
