import { useState } from "react";
import { ScrollView, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import FloatingToolbar from "@/presentation/theme/components/floating-toolbar";
import { AccountType, type Account } from "@/core/restaurant/models/account.model";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";

const categoryIcons: Record<PaymentMethodCategory, keyof typeof Ionicons.glyphMap> = {
  [PaymentMethodCategory.CASH]: "cash-outline",
  [PaymentMethodCategory.CARD]: "card-outline",
  [PaymentMethodCategory.TRANSFER]: "swap-horizontal-outline",
  [PaymentMethodCategory.DIGITAL_WALLET]: "wallet-outline",
  [PaymentMethodCategory.OTHER]: "ellipsis-horizontal-circle-outline",
};

export default function PaymentMethodDetailsScreen() {
  const { t } = useTranslation("paymentMethods");
  const params = useLocalSearchParams<{ methodId: string }>();
  const { paymentMethods } = usePaymentMethods();
  const { updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [deleteVisible, setDeleteVisible] = useState(false);

  const method = paymentMethods.find((m) => String(m.id) === params.methodId);

  const handleEditMethod = () => {
    if (!method) return;
    router.push({
      pathname: "/(profile)/payment-method-form",
      params: {
        methodId: String(method.id),
        name: method.name,
        type: method.type,
        commissionPercentage: String(method.commissionPercentage ?? 0),
        allowedDestinationAccountIds: method.allowedDestinationAccounts
          .map((a) => a.id)
          .join(","),
        defaultDestinationAccountId: method.defaultDestinationAccount?.id
          ? String(method.defaultDestinationAccount.id)
          : "",
        isActive: String(method.isActive),
      },
    });
  };

  const handleToggleActive = () => {
    if (!method) return;
    updatePaymentMethod.mutate({
      id: method.id,
      data: { isActive: !method.isActive },
    });
  };

  const handleConfirmDelete = async () => {
    if (!method) return;
    await deletePaymentMethod.mutateAsync(method.id);
    setDeleteVisible(false);
    router.back();
  };

  const accountIcon = (type: Account["type"]) =>
    type === AccountType.BANK ? "business-outline" : "cash-outline";

  if (!method) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center gap-4 flex-row`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
        </ThemedView>
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("methods.notFound")}
          </ThemedText>
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-back-outline"
            variant="outline"
            onPress={() => router.back()}
          />
        </ThemedView>
      </ScreenLayout>
    );
  }

  return (
    <View style={tw`flex-1 relative`}>
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        <ThemedView style={tw`items-center flex-row mb-6`}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="arrow-back-outline" size={24} />
          </Pressable>
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`gap-4 pb-8`}
        >
          <ThemedView style={tw`gap-1`}>
            <ThemedText type="h1">{method.name}</ThemedText>
          </ThemedView>

          <ThemedView style={tw`flex-row items-center gap-2 flex-wrap`}>
            <Label
              text={method.isActive ? t("active") : t("inactive")}
              color={method.isActive ? "success" : "default"}
            />
            <Label
              text={t(getPaymentMethodTranslationKey(method.type))}
              leftIcon={categoryIcons[method.type]}
            />
            <Label
              text={`${method.commissionPercentage}%`}
              leftIcon="pricetag-outline"
            />
          </ThemedView>

          {method.defaultDestinationAccount && (
            <ThemedView style={tw`gap-3 mt-4`}>
              <ThemedText type="h4">
                {t("methods.fields.defaultAccount")}
              </ThemedText>
              <Card style={tw`bg-light-secondary`}>
                <ThemedView
                  style={tw`flex-row items-center gap-3 bg-transparent`}
                >
                  <Ionicons
                    name={accountIcon(method.defaultDestinationAccount.type)}
                    size={26}
                    color={tw.color("text-light-on-secondary")}
                  />
                  <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                    <ThemedText
                      type="body1"
                      style={tw`font-semibold text-light-on-secondary`}
                    >
                      {method.defaultDestinationAccount.name}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={tw`text-light-on-secondary/70`}
                    >
                      {t(
                        `accounts.types.${method.defaultDestinationAccount.type}`,
                      )}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </Card>
            </ThemedView>
          )}

          <ThemedView style={tw`gap-3 mt-4`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText type="h4">
                {t("methods.fields.allowedAccounts")}
              </ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("methods.fields.allowedAccountsDescription")}
              </ThemedText>
            </ThemedView>

            <ThemedView style={tw`gap-3`}>
              {method.allowedDestinationAccounts
                .filter(
                  (account) =>
                    account.id !== method.defaultDestinationAccount?.id,
                )
                .map((account) => (
                  <Card key={account.id}>
                    <ThemedView
                      style={tw`flex-row items-center gap-3 bg-transparent`}
                    >
                      <Ionicons
                        name={accountIcon(account.type)}
                        size={26}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                        <ThemedText type="body1" style={tw`font-semibold`}>
                          {account.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t(`accounts.types.${account.type}`)}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </Card>
                ))}
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ScreenLayout>

      {canManage && (
        <View
          style={tw`absolute bottom-8 left-0 right-0 items-center`}
          pointerEvents="box-none"
        >
          <FloatingToolbar
            items={[
              {
                icon: "create-outline",
                onPress: handleEditMethod,
              },
              {
                icon: method.isActive ? "eye-off-outline" : "eye-outline",
                onPress: handleToggleActive,
              },
              {
                icon: "trash-outline",
                onPress: () => setDeleteVisible(true),
              },
            ]}
          />
        </View>
      )}

      <DialogModal
        visible={deleteVisible}
        title={t("methods.deleteTitle")}
        message={t("methods.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deletePaymentMethod.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </View>
  );
}
