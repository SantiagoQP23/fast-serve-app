import { useState, useRef, useCallback, type ReactNode } from "react";
import {
  ScrollView,
  Image,
  Alert,
  Linking,
  Pressable,
  View,
  RefreshControl,
  Modal,
  type StyleProp,
  type ViewStyle,
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
import Label, {
  labelSolidStyles,
  type LabelProps,
} from "@/presentation/theme/components/label";
import Avatar from "@/presentation/theme/components/avatar";
import Card from "@/presentation/theme/components/card";
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
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet, {
  type ActionsBottomSheetItem,
} from "@/presentation/theme/components/actions-bottom-sheet";

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
  const uploadSourceSheetRef = useRef<BottomSheetMethods>(null);
  // Source picked in the sheet; the picker opens once the sheet has closed.
  const pendingSourceRef = useRef<"camera" | "gallery" | null>(null);
  const moreSheetRef = useRef<BottomSheetMethods>(null);
  // Action picked in the ⋯ sheet; it runs once the sheet has closed.
  const pendingMoreActionRef = useRef<(() => void) | null>(null);

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

  const chooseUploadSource = (source: "camera" | "gallery") => {
    pendingSourceRef.current = source;
    uploadSourceSheetRef.current?.dismiss();
  };

  // Opening the picker while the native sheet is still closing fails on iOS
  // and is unreliable on Android, so wait for the dismiss to finish.
  const handleUploadSourceSheetDismiss = () => {
    const source = pendingSourceRef.current;
    pendingSourceRef.current = null;
    if (source) pickImage(source);
  };

  const chooseMoreAction = (action: () => void) => {
    pendingMoreActionRef.current = action;
    moreSheetRef.current?.dismiss();
  };

  const handleMoreSheetDismiss = () => {
    const action = pendingMoreActionRef.current;
    pendingMoreActionRef.current = null;
    action?.();
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
  const statusText = t(`common:transactions.status.${status.key}`);
  const accountLabel = transaction.account
    ? transaction.account.num
      ? `${transaction.account.name} #${transaction.account.num}`
      : transaction.account.name
    : undefined;
  const metadata = transaction.metadata;
  const latestProof = proofs[0];
  const previousProofs = proofs.slice(1);
  const bill = transaction.bill;
  const creatorName = getUserDisplayName(
    transaction.createdBy,
    t("common:labels.deletedUser"),
  );

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
        personName(proof.uploadedBy?.person) || t("common:labels.deletedUser"),
      date: dayjs(proof.createdAt).format(DATE_FORMAT),
    });

  const openBill = () => {
    if (bill) router.push(`/(bills)/${bill.id}`);
  };

  // One main pill: approving when the user reviews transfers, otherwise
  // uploading the proof the transfer is still missing.
  const mainAction: "approve" | "upload" | null = canApproveTransaction
    ? "approve"
    : canUploadProof && !selectedImage
      ? "upload"
      : null;

  // With no proof yet, the upload button sits in the proof card.
  const canUploadAnother =
    canUploadProof &&
    !!latestProof &&
    !selectedImage &&
    mainAction !== "upload";
  const hasMoreActions = canRejectTransaction || canUploadAnother || !!bill;

  const moreItems: ActionsBottomSheetItem[] = [
    ...(canRejectTransaction
      ? [
          {
            icon: "circle-x" as IconName,
            label: t("common:actions.reject"),
            onPress: () =>
              chooseMoreAction(() => rejectSheetRef.current?.present()),
          },
        ]
      : []),
    ...(canUploadAnother
      ? [
          {
            icon: "upload" as IconName,
            label: t("bills:proofUpload.uploadAnother"),
            onPress: () =>
              chooseMoreAction(() => uploadSourceSheetRef.current?.present()),
          },
        ]
      : []),
    ...(bill
      ? [
          {
            icon: "receipt-text" as IconName,
            label: t("common:transactions.seeBill"),
            onPress: () => chooseMoreAction(openBill),
          },
        ]
      : []),
  ];

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
        contentContainerStyle={tw`px-4 pt-2 pb-8 gap-4`}
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
        {/* Header: amount, what it was for, and when */}
        <ThemedView style={tw`gap-5 mb-2`}>
          <ThemedView style={tw`flex-row items-start gap-4`}>
            <ThemedView style={tw`flex-1 gap-1`}>
              <ThemedText
                type="h1"
                // h1 fixes its height for 32px text; size the box for 44px.
                style={{
                  fontSize: 44,
                  fontFamily: typography.bold,
                  lineHeight: 54,
                  height: 54,
                }}
              >
                {formatCurrency(transaction.amount)}
              </ThemedText>
              <ThemedText type="h4">{transaction.name}</ThemedText>
              <ThemedText type="body1" style={tw`text-gray-500`}>
                {dayjs(transaction.createdAt).format(DATE_FORMAT)}
              </ThemedText>
            </ThemedView>

            {/* Payment method, with the status as a badge */}
            <ThemedView
              accessible
              accessibilityLabel={`${transaction.paymentMethod.name}, ${statusText}`}
              style={tw`w-16 h-16 mt-1 rounded-full items-center justify-center bg-surface`}
            >
              <Icon
                name={
                  paymentMethodIcon[transaction.paymentMethod.type] ?? "wallet"
                }
                size={28}
                color={tw.color("primary")}
              />
              <ThemedView
                style={[
                  tw`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full items-center justify-center ${labelSolidStyles[status.color ?? "default"].dot}`,
                  { borderWidth: 2, borderColor: tw.color("background") },
                ]}
              >
                <Icon name={status.icon} size={12} color="white" />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {(mainAction || canChangeAccount || hasMoreActions) && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              {mainAction === "approve" && (
                <Button
                  label={t("common:actions.approve")}
                  leftIcon="check"
                  shape="rounded"
                  size="small"
                  onPress={openApproveModal}
                />
              )}
              {mainAction === "upload" && (
                <Button
                  label={t("bills:proofUpload.uploadProof")}
                  leftIcon="upload"
                  shape="rounded"
                  size="small"
                  onPress={() => uploadSourceSheetRef.current?.present()}
                />
              )}
              {canChangeAccount && (
                <Button
                  label={t("common:transactions.changeAccount")}
                  leftIcon="landmark"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  onPress={() => accountBottomSheetRef.current?.present()}
                />
              )}
              {hasMoreActions && (
                <Button
                  leftIcon="ellipsis"
                  variant="surface"
                  shape="rounded"
                  size="small"
                  accessibilityLabel={t("common:actions.more")}
                  onPress={() => moreSheetRef.current?.present()}
                />
              )}
            </ThemedView>
          )}
        </ThemedView>

        {/* Info */}
        <InfoCard style={tw`py-2`}>
          <CardRow label={t("common:transactions.statusLabel")}>
            <Label
              size="small"
              color={status.color}
              leftIcon={status.icon}
              text={statusText}
            />
          </CardRow>
          <CardRow
            label={t("common:transactions.paymentMethod")}
            value={transaction.paymentMethod.name}
          />
          <CardRow
            label={t("common:transactions.destinationAccount")}
            value={accountLabel ?? "—"}
            trailing={
              canManage && accountLockReason ? (
                <IconButton
                  icon="info"
                  size={20}
                  onPress={() => accountLockedSheetRef.current?.present()}
                  accessibilityLabel={t(
                    "common:transactions.accountLocked.infoLabel",
                  )}
                />
              ) : undefined
            }
          />
          {metadata?.type === "TRANSFER" && !!metadata.bankReference && (
            <CardRow
              label={t("bills:proofUpload.bankReference")}
              value={metadata.bankReference}
            />
          )}
          {metadata?.type === "TRANSFER" && !!metadata.senderName && (
            <CardRow
              label={t("bills:proofUpload.senderName")}
              value={metadata.senderName}
            />
          )}
          {metadata?.type === "CARD" && (
            <CardRow
              label={t("common:transactions.totalWithCommission")}
              value={formatCurrency(metadata.totalWithCommission)}
            />
          )}
          {metadata?.type === "CASH" && metadata.cashReceived != null && (
            <CardRow
              label={t("common:transactions.cashReceived")}
              value={formatCurrency(metadata.cashReceived)}
            />
          )}
          {metadata?.type === "CASH" && metadata.changeGiven != null && (
            <CardRow
              label={t("common:transactions.changeGiven")}
              value={formatCurrency(metadata.changeGiven)}
            />
          )}
        </InfoCard>

        {/* Proof: the thing being verified, shown big enough to read */}
        {isTransfer && (
          <InfoCard style={tw`py-5 gap-4`}>
            <CardTitle title={t("bills:proofUpload.proof")} />

            {latestProof ? (
              <ThemedView style={tw`gap-2`}>
                <Pressable
                  onPress={() => openPreview(0)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${t("bills:proofUpload.viewProof")}, ${t(
                    `common:status.${proofStatusLabel[latestProof.status].key}`,
                  )}`}
                  style={({ pressed }) => [
                    tw`rounded-2xl overflow-hidden bg-surface`,
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
                style={tw`items-center gap-2 px-6 py-8 rounded-2xl bg-surface`}
              >
                <Icon name="image" size={32} color={tw.color("gray-500")} />
                <ThemedText type="h4" style={tw`text-center`}>
                  {isSettled
                    ? t("bills:proofUpload.noProofSettled")
                    : t("bills:proofUpload.noProofTitle")}
                </ThemedText>
                {canUploadProof && !selectedImage && (
                  <Button
                    label={t("bills:proofUpload.uploadProof")}
                    leftIcon="upload"
                    onPress={() => uploadSourceSheetRef.current?.present()}
                    style={tw`mt-2`}
                  />
                )}
              </ThemedView>
            )}

            {proofHint && (
              <ThemedText type="body2" style={tw`text-gray-500`}>
                {proofHint}
              </ThemedText>
            )}

            {/* Upload: a picked image waits here until it's sent */}
            {canUploadProof && selectedImage && (
              <ThemedView style={tw`gap-3`}>
                <Pressable
                  onPress={() => openPreview(proofs.length)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t("bills:proofUpload.viewProof")}
                  style={tw`rounded-2xl overflow-hidden bg-surface`}
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
            )}

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
          </InfoCard>
        )}

        {/* Who recorded it */}
        <InfoCard style={tw`py-5 gap-4`}>
          <CardTitle title={t("common:transactions.createdBy")} />
          <ThemedView style={tw`flex-row items-center gap-4`}>
            <Avatar
              name={transaction.createdBy ? creatorName : undefined}
              size={48}
            />
            <ThemedView style={tw`flex-1 gap-0.5`}>
              <ThemedText style={{ fontFamily: typography.bold }}>
                {creatorName}
              </ThemedText>
              {!!transaction.createdBy?.email && (
                <ThemedText type="body2" selectable style={tw`text-gray-500`}>
                  {transaction.createdBy.email}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </InfoCard>

        {/* The bill this payment belongs to */}
        {bill && (
          <ThemedView style={tw`gap-3 mt-4`}>
            <ThemedText type="h3" accessibilityRole="header">
              {t("common:transactions.bill")}
            </ThemedText>
            <Card
              variant="outline"
              onPress={openBill}
              accessibilityRole="button"
              accessibilityLabel={`${t("common:transactions.seeBill")}, ${t(
                "common:transactions.billNumber",
                { num: bill.num },
              )}`}
              style={tw`flex-row items-center gap-4 px-5 py-4`}
            >
              <ThemedView
                style={tw`w-12 h-12 rounded-full items-center justify-center bg-surface`}
              >
                <Icon
                  name="receipt-text"
                  size={22}
                  color={tw.color("primary")}
                />
              </ThemedView>
              <ThemedView style={tw`flex-1 gap-0.5`}>
                <ThemedText style={{ fontFamily: typography.semibold }}>
                  {t("common:transactions.billNumber", { num: bill.num })}
                </ThemedText>
                {!!bill.createdAt && (
                  <ThemedText type="body2" style={tw`text-gray-500`}>
                    {dayjs(bill.createdAt).format(DATE_FORMAT)}
                  </ThemedText>
                )}
              </ThemedView>
              {bill.total != null && (
                <ThemedText>{formatCurrency(bill.total)}</ThemedText>
              )}
              <Icon
                name="chevron-right"
                size={20}
                color={tw.color("gray-500")}
              />
            </Card>
          </ThemedView>
        )}
      </ScrollView>

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
              {
                paddingTop: insets.top + 8,
                backgroundColor: "rgba(0,0,0,0.6)",
              },
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

      <ThemedBottomSheetModal
        ref={moreSheetRef}
        enablePanDownToClose
        onDismiss={handleMoreSheetDismiss}
      >
        <ActionsBottomSheet items={moreItems} />
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal
        ref={uploadSourceSheetRef}
        enablePanDownToClose
        onDismiss={handleUploadSourceSheetDismiss}
      >
        <ActionsBottomSheet
          title={t("bills:proofUpload.uploadTitle")}
          items={[
            {
              icon: "images",
              label: t("bills:proofUpload.fromGallery"),
              onPress: () => chooseUploadSource("gallery"),
            },
            {
              icon: "camera",
              label: t("bills:proofUpload.fromCamera"),
              onPress: () => chooseUploadSource("camera"),
            },
          ]}
        />
      </ThemedBottomSheetModal>

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

/** Outlined card that groups related rows. */
function InfoCard({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Card variant="outline" style={[tw`px-5`, style]}>
      {children}
    </Card>
  );
}

/** Quiet heading inside a card. */
function CardTitle({ title }: { title: string }) {
  return (
    <ThemedText accessibilityRole="header" style={tw`text-gray-500`}>
      {title}
    </ThemedText>
  );
}

/**
 * Label on the left, value on the right. Values are selectable so a
 * reference can be copied; `children` replaces the value (e.g. a Label) and
 * `trailing` holds a row action.
 */
function CardRow({
  label,
  value,
  trailing,
  children,
}: {
  label: string;
  value?: string;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ThemedView
      // Grouping would hide a trailing control from screen readers.
      accessible={!trailing && value != null}
      accessibilityLabel={
        !trailing && value != null ? `${label}, ${value}` : undefined
      }
      style={tw`flex-row items-center gap-4 min-h-14 py-2`}
    >
      <ThemedText style={tw`text-gray-500`}>{label}</ThemedText>
      <ThemedView style={tw`flex-1 flex-row items-center justify-end gap-2`}>
        {children ?? (
          <ThemedText selectable style={tw`flex-shrink text-right`}>
            {value}
          </ThemedText>
        )}
        {trailing}
      </ThemedView>
    </ThemedView>
  );
}
