import { useRef, useState } from "react";
import { ScrollView, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import FloatingToolbar from "@/presentation/theme/components/floating-toolbar";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import {
  AccountType,
  type Account,
} from "@/core/restaurant/models/account.model";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";

const categoryIcons: Record<
  PaymentMethodCategory,
  keyof typeof Ionicons.glyphMap
> = {
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
  const {
    updatePaymentMethod,
    deletePaymentMethod,
    unlinkAccount,
    setDefaultAccount,
  } = usePaymentMethodsManagement();
  const { updateAccount } = useAccountsManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const accountActionsSheetRef = useRef<BottomSheetMethods>(null);

  const method = paymentMethods.find((m) => String(m.id) === params.methodId);

  const handleEditMethod = () => {
    if (!method) return;
    router.push({
      pathname: "/(profile)/payment-method-edit",
      params: { methodId: String(method.id) },
    });
  };

  const handleAddAccount = () => {
    if (!method) return;
    router.push({
      pathname: "/(profile)/payment-method-account-select",
      params: { methodId: String(method.id) },
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

  const handleOpenAccountActions = (account: Account) => {
    setSelectedAccount(account);
    accountActionsSheetRef.current?.present();
  };

  const handleCloseAccountActions = () => {
    accountActionsSheetRef.current?.dismiss();
  };

  const handleEditAccount = (account: Account) => {
    router.push({
      pathname: "/(profile)/account-form",
      params: {
        accountId: String(account.id),
        name: account.name,
        description: account.description || "",
        num: account.num || "",
        type: account.type,
        isActive: String(account.isActive),
      },
    });
  };

  const handleToggleAccountActive = () => {
    if (!selectedAccount) return;
    updateAccount.mutate({
      id: selectedAccount.id,
      data: { isActive: !selectedAccount.isActive },
    });
    handleCloseAccountActions();
  };

  const handleSetDefaultAccount = () => {
    if (!method || !selectedAccount) return;
    setDefaultAccount.mutate({ id: method.id, accountId: selectedAccount.id });
    handleCloseAccountActions();
  };

  const handleRemoveAccount = () => {
    if (!method || !selectedAccount) return;
    const remainingAccounts = method.allowedDestinationAccounts.filter(
      (candidate) => candidate.id !== selectedAccount.id,
    );
    if (remainingAccounts.length === 0) return;

    const isRemovingDefault =
      method.defaultDestinationAccount?.id === selectedAccount.id;

    const unlink = () =>
      unlinkAccount.mutate({ id: method.id, accountId: selectedAccount.id });

    if (isRemovingDefault) {
      // Reassign the default before unlinking, so the method is never left
      // pointing at an account it no longer allows.
      setDefaultAccount.mutate(
        { id: method.id, accountId: remainingAccounts[0].id },
        { onSuccess: unlink },
      );
    } else {
      unlink();
    }
    handleCloseAccountActions();
  };

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

  const sortedAccounts = [...method.allowedDestinationAccounts].sort((a, b) => {
    if (a.id === method.defaultDestinationAccount?.id) return -1;
    if (b.id === method.defaultDestinationAccount?.id) return 1;
    return 0;
  });

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

          <ThemedView style={tw`gap-3 mt-4`}>
            {/* <ThemedView style={tw`gap-1`}> */}
            {/*   <ThemedText type="h4"> */}
            {/*     {t("methods.fields.allowedAccounts")} */}
            {/*   </ThemedText> */}
            {/*   <ThemedText type="small" style={tw`text-gray-500`}> */}
            {/*     {t("methods.fields.allowedAccountsDescription")} */}
            {/*   </ThemedText> */}
            {/* </ThemedView> */}

            <ThemedView style={tw`gap-3`}>
              {sortedAccounts.map((account) => {
                const isDefault =
                  method.defaultDestinationAccount?.id === account.id;
                return (
                  <Card
                    key={account.id}
                    onPress={
                      canManage
                        ? () => handleOpenAccountActions(account)
                        : undefined
                    }
                    style={isDefault && tw`bg-light-secondary`}
                  >
                    <ThemedView
                      style={tw`flex-row items-center gap-3 bg-transparent`}
                    >
                      <Ionicons
                        name={accountIcon(account.type)}
                        size={26}
                        color={
                          isDefault
                            ? tw.color("light-on-secondary")
                            : tw.color("text-light-on-surface-variant")
                        }
                      />
                      <ThemedView style={tw`flex-1 gap-1 bg-transparent`}>
                        <ThemedText
                          type="body1"
                          style={[
                            tw`font-semibold`,
                            isDefault && tw`text-light-on-secondary`,
                          ]}
                        >
                          {account.name}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          style={
                            isDefault
                              ? tw`text-light-on-secondary/70`
                              : tw`text-gray-500`
                          }
                        >
                          {t(`accounts.types.${account.type}`)}
                        </ThemedText>
                      </ThemedView>
                      {isDefault && (
                        <Ionicons
                          name="star"
                          size={18}
                          color={tw.color("light-on-secondary")}
                        />
                      )}
                    </ThemedView>
                  </Card>
                );
              })}
            </ThemedView>

            {canManage && (
              <Button
                label={t("methods.fields.addAccount")}
                onPress={handleAddAccount}
                variant="outline"
                size="small"
                leftIcon="add-outline"
              />
            )}
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

      <ThemedBottomSheetModal ref={accountActionsSheetRef} enablePanDownToClose>
        {selectedAccount && (
          <ActionsBottomSheet
            title={selectedAccount.name}
            items={[
              {
                icon: "create-outline",
                label: t("edit"),
                onPress: () => {
                  handleCloseAccountActions();
                  handleEditAccount(selectedAccount);
                },
              },
              {
                icon: selectedAccount.isActive
                  ? "eye-off-outline"
                  : "eye-outline",
                label: selectedAccount.isActive
                  ? t("deactivate")
                  : t("activate"),
                onPress: handleToggleAccountActive,
              },
              ...(method.defaultDestinationAccount?.id !== selectedAccount.id
                ? [
                    {
                      icon: "star-outline" as const,
                      label: t("setDefaultAccount"),
                      onPress: handleSetDefaultAccount,
                    },
                  ]
                : []),
              ...(method.allowedDestinationAccounts.length > 1
                ? [
                    {
                      icon: "close-circle-outline" as const,
                      label: t("removeAccount"),
                      color: "text-red-500",
                      onPress: handleRemoveAccount,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </ThemedBottomSheetModal>
    </View>
  );
}
