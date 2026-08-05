import { ScrollView, Alert, Image, Pressable } from "react-native";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "@/presentation/theme/components/button";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { formatCurrency } from "@/core/i18n/utils";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { usePaymentProofs } from "@/presentation/transactions/hooks/usePaymentProofs";
import { useOrdersStore } from "@/presentation/orders/store/useOrdersStore";
import * as ImagePicker from "expo-image-picker";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { PaymentProofStatus } from "@/core/transactions/models/payment-proof.model";

export default function ProofUploadScreen() {
  const { t } = useTranslation(["common", "bills", "errors"]);
  const router = useRouter();
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
          Alert.alert(
            t("common:status.success"),
            t("bills:proofUpload.uploadSuccess"),
          );
        },
        onError: (error: any) => {
          Alert.alert(
            t("errors:general.error"),
            error?.response?.data?.message ||
              error?.message ||
              t("errors:general.unknownError"),
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
              {transaction.paymentMethod?.commissionPercentage}%
              {t("bills:details.commission").toLowerCase()}
            </ThemedText>
          )}
        </ThemedView>

        {/* Status badge */}
        {hasPendingProof && (
          <ThemedView
            style={tw`flex-row items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200`}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={tw.color("yellow-600")}
            />
            <ThemedText type="body2" style={tw`text-yellow-700 font-medium`}>
              {t("bills:proofUpload.awaitingValidation")}
            </ThemedText>
          </ThemedView>
        )}
        {hasApprovedProof && (
          <ThemedView
            style={tw`flex-row items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200`}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={tw.color("green-600")}
            />
            <ThemedText type="body2" style={tw`text-green-700 font-medium`}>
              {t("bills:proofUpload.approved")}
            </ThemedText>
          </ThemedView>
        )}
        {hasRejectedProof && (
          <ThemedView
            style={tw`flex-row items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200`}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={tw.color("red-600")}
            />
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="body2" style={tw`text-red-700 font-medium`}>
                {t("bills:proofUpload.rejected")}
              </ThemedText>
              {latestProof.rejectionReason && (
                <ThemedText type="small" style={tw`text-red-500 mt-1`}>
                  {latestProof.rejectionReason}
                </ThemedText>
              )}
            </ThemedView>
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
                style={tw`rounded-xl border border-gray-200 overflow-hidden`}
              >
                <Image
                  source={{ uri: proof.fileUrl }}
                  style={tw`w-full h-48`}
                  resizeMode="cover"
                />
                <ThemedView style={tw`p-3 flex-row items-center justify-between`}>
                  <ThemedText type="small" style={tw`text-gray-500`}>
                    {new Date(proof.createdAt).toLocaleDateString()}
                  </ThemedText>
                  <ThemedView
                    style={tw`px-2 py-1 rounded-full ${
                      proof.status === PaymentProofStatus.PENDING
                        ? "bg-yellow-100"
                        : proof.status === PaymentProofStatus.APPROVED
                          ? "bg-green-100"
                          : "bg-red-100"
                    }`}
                  >
                    <ThemedText
                      type="small"
                      style={tw`${
                        proof.status === PaymentProofStatus.PENDING
                          ? "text-yellow-700"
                          : proof.status === PaymentProofStatus.APPROVED
                            ? "text-green-700"
                            : "text-red-700"
                      } font-medium`}
                    >
                      {proof.status}
                    </ThemedText>
                  </ThemedView>
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
                  style={tw`rounded-xl border border-gray-200 overflow-hidden`}
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
                    tw`flex-1 items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 gap-2`,
                    pressed && tw`opacity-70 bg-gray-100`,
                  ]}
                >
                  <Ionicons
                    name="images-outline"
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
                    tw`flex-1 items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 gap-2`,
                    pressed && tw`opacity-70 bg-gray-100`,
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
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
      <ThemedView style={tw`px-4 pb-6 pt-4 border-t border-gray-200 gap-3`}>
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
