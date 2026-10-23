import { ScrollView, Image, Pressable } from "react-native";
import { toast } from "sonner-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency, formatDate } from "@/core/i18n/utils";
import Label, { type LabelProps } from "@/presentation/theme/components/label";
import Icon from "@/presentation/theme/components/icon";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import * as ImagePicker from "expo-image-picker";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { PaymentProofStatus } from "@/core/transactions/models/payment-proof.model";
import { getErrorMessage } from "@/core/api/get-error-message";

export default function ProofUploadScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();

  const proofStatusLabel = (
    status: PaymentProofStatus,
  ): Pick<LabelProps, "color" | "text" | "leftIcon"> =>
    status === PaymentProofStatus.APPROVED
      ? {
          color: "success",
          text: t("bills:proofUpload.approved"),
          leftIcon: "circle-check",
        }
      : status === PaymentProofStatus.PENDING
        ? {
            color: "warning",
            text: t("bills:proofUpload.awaitingValidation"),
            leftIcon: "clock",
          }
        : {
            color: "error",
            text: t("bills:proofUpload.rejected"),
            leftIcon: "circle-x",
          };
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);

  const activePendingTransaction = useOrdersStore(
    (state) => state.activePendingTransaction,
  );
  const setActivePendingTransaction = useOrdersStore(
    (state) => state.setActivePendingTransaction,
  );

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const {
    proofs,
    uploadProof,
  } = usePaymentProofs(transactionId);

  const transaction = activePendingTransaction;
  const isCard =
    transaction?.paymentMethod?.type === PaymentMethodCategory.CARD;
  const commissionRate = transaction?.paymentMethod?.commissionPercentage
    ? transaction.paymentMethod.commissionPercentage / 100
    : 0;
  const totalWithCommission = transaction
    ? transaction.amount * (1 + commissionRate)
    : 0;

  const latestProof = proofs[0];
  const hasPendingProof = latestProof?.status === PaymentProofStatus.PENDING;
  const hasApprovedProof = latestProof?.status === PaymentProofStatus.APPROVED;
  const hasRejectedProof = latestProof?.status === PaymentProofStatus.REJECTED;

  const pickImage = async (source: "camera" | "gallery") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      toast.error(t("errors:general.cameraPermissionRequired"));
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedImage || !transaction) return;

    uploadProof.mutate(
      {
        transactionId: transaction.id,
        fileUri: selectedImage.uri,
        fileName: selectedImage.fileName || "proof.jpg",
        mimeType: selectedImage.mimeType || "image/jpeg",
      },
      {
        onSuccess: () => {
          setSelectedImage(null);
          toast.success(t("bills:proofUpload.uploadSuccess"));
        },
        onError: (error: any) => {
          toast.error(
            getErrorMessage(error, { fallbackToServerMessage: true }),
          );
        },
      },
    );
  };

  const handleSkip = () => {
    setActivePendingTransaction(null);
    router.back();
    router.back();
    router.back();
  };

  if (!transaction) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center`}>
        <ThemedText>{t("errors:general.noData")}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenLayout style={tw`flex-1`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-6 pb-4 gap-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction summary */}
        <ThemedView style={tw`items-center gap-2`}>
          <ThemedText type="caption" style={tw`text-gray-500`}>
            {t("bills:details.totalToPay")}
          </ThemedText>
          <ThemedText style={tw`text-4xl font-bold`}>
            {formatCurrency(isCard ? totalWithCommission : transaction.amount)}
          </ThemedText>
          {isCard && commissionRate > 0 && (
            <ThemedText type="body2" style={tw`text-gray-500`}>
              {t("bills:details.totalAmount")}:{" "}
              {formatCurrency(transaction.amount)} +{" "}
              {transaction.paymentMethod?.commissionPercentage}%{" "}
              {t("bills:details.commission").toLowerCase()}
            </ThemedText>
          )}
        </ThemedView>

        {/* Status */}
        {(hasPendingProof || hasApprovedProof || hasRejectedProof) && (
          <ThemedView style={tw`items-center gap-2`}>
            <Label
              {...proofStatusLabel(
                hasApprovedProof
                  ? PaymentProofStatus.APPROVED
                  : hasPendingProof
                    ? PaymentProofStatus.PENDING
                    : PaymentProofStatus.REJECTED,
              )}
            />
            {hasRejectedProof && latestProof.rejectionReason && (
              <ThemedText type="body2" style={tw`text-red-700 text-center`}>
                {latestProof.rejectionReason}
              </ThemedText>
            )}
          </ThemedView>
        )}

        {/* Proof history */}
        {proofs.length > 0 && (
          <ThemedView style={tw`gap-3`}>
            <ThemedText type="h4" style={tw`font-bold`}>
              {t("bills:proofUpload.proofHistory")}
            </ThemedText>
            {proofs.map((proof) => (
              <ThemedView
                key={proof.id}
                style={tw`rounded-md border border-border overflow-hidden`}
              >
                <Image
                  source={{ uri: proof.fileUrl }}
                  style={tw`w-full h-48`}
                  resizeMode="cover"
                />
                <ThemedView style={tw`p-3 flex-row items-center justify-between`}>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {formatDate(proof.createdAt)}
                  </ThemedText>
                  <Label size="small" {...proofStatusLabel(proof.status)} />
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Upload section */}
        {!hasPendingProof && !hasApprovedProof && (
          <ThemedView style={tw`gap-4`}>
            <ThemedText type="h4" style={tw`font-bold`}>
              {t("bills:proofUpload.uploadTitle")}
            </ThemedText>

            {selectedImage ? (
              <ThemedView style={tw`gap-4`}>
                <ThemedView
                  style={tw`rounded-md border border-border overflow-hidden`}
                >
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={tw`w-full h-64`}
                    resizeMode="cover"
                  />
                </ThemedView>
                <ThemedView style={tw`flex-row gap-3`}>
                  <Button
                    label={t("common:actions.change")}
                    variant="outline"
                    onPress={() => setSelectedImage(null)}
                    style={tw`flex-1`}
                  />
                  <Button
                    label={t("common:actions.upload")}
                    onPress={handleUpload}
                    loading={uploadProof.isPending}
                    disabled={uploadProof.isPending}
                    style={tw`flex-1`}
                  />
                </ThemedView>
              </ThemedView>
            ) : (
              <ThemedView style={tw`flex-row gap-3`}>
                <Pressable
                  onPress={() => pickImage("gallery")}
                  style={({ pressed }) => [
                    tw`flex-1 items-center justify-center p-6 rounded-md border-2 border-dashed border-border bg-surface gap-2`,
                    pressed && tw`opacity-70`,
                  ]}
                >
                  <Icon
                    name="images"
                    size={32}
                    color={tw.color("gray-400")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                    {t("bills:proofUpload.fromGallery")}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => pickImage("camera")}
                  style={({ pressed }) => [
                    tw`flex-1 items-center justify-center p-6 rounded-md border-2 border-dashed border-border bg-surface gap-2`,
                    pressed && tw`opacity-70`,
                  ]}
                >
                  <Icon
                    name="camera"
                    size={32}
                    color={tw.color("gray-400")}
                  />
                  <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                    {t("bills:proofUpload.fromCamera")}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <ThemedView style={tw`px-4 pb-6 pt-4 border-t border-divider gap-3`}>
        {!hasPendingProof && !hasApprovedProof && (
          <Button
            label={t("bills:proofUpload.skipForNow")}
            variant="outline"
            onPress={handleSkip}
          />
        )}
        {(hasPendingProof || hasApprovedProof) && (
          <Button
            label={t("common:actions.done")}
            onPress={() => {
              setActivePendingTransaction(null);
              router.back();
              router.back();
              router.back();
            }}
          />
        )}
      </ThemedView>
    </ScreenLayout>
  );
}
