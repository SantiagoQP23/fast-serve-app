import { useRef, useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
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
import Label from "@/presentation/theme/components/label";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import DetailHeader from "@/presentation/theme/components/detail-header";
import {
  DetailCard,
  DetailCardRow,
  DetailSectionTitle,
} from "@/presentation/theme/components/detail-card";
import {
  AccountType,
  type Account,
} from "@/core/restaurant/models/account.model";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";

const categoryIcons: Record<PaymentMethodCategory, IconName> = {
  [PaymentMethodCategory.CASH]: "banknote",
  [PaymentMethodCategory.CARD]: "credit-card",
  [PaymentMethodCategory.TRANSFER]: "arrow-left-right",
  [PaymentMethodCategory.DIGITAL_WALLET]: "wallet",
  [PaymentMethodCategory.OTHER]: "circle-ellipsis",
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
  const moreSheetRef = useRef<BottomSheetMethods>(null);

  const method = paymentMethods.find((m) => String(m.id) === params.methodId);

  const handleEditMethod = () => {
    if (!method) return;
    router.push({
      pathname: "/(profile)/payment-methods/edit",
      params: { methodId: String(method.id) },
    });
  };

  const handleAddAccount = () => {
    if (!method) return;
    router.push({
      pathname: "/(profile)/payment-methods/account-select",
      params: { methodId: String(method.id) },
    });
  };

  const handleToggleActive = () => {
    if (!method) return;
    moreSheetRef.current?.dismiss();
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
    type === AccountType.BANK ? "building" : "banknote";

  const handleOpenAccountActions = (account: Account) => {
    setSelectedAccount(account);
    accountActionsSheetRef.current?.present();
  };

  const handleCloseAccountActions = () => {
    accountActionsSheetRef.current?.dismiss();
  };

  const handleEditAccount = (account: Account) => {
    router.push({
      pathname: "/(profile)/payment-methods/account-form",
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

  const header = (
    <ThemedView style={tw`items-center flex-row mb-6`}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common:actions.goBack")}
        hitSlop={12}
        style={({ pressed }) => tw.style(pressed && "opacity-70")}
      >
        <Icon name="arrow-left" color={tw.color("on-surface")} size={24} />
      </Pressable>
    </ThemedView>
  );

  if (!method) {
    return (
      <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
        {header}
        <ThemedView style={tw`items-center py-8 gap-3`}>
          <Icon name="circle-alert" size={48} color={tw.color("red-500")} />
          <ThemedText type="body1" style={tw`text-gray-500`}>
            {t("methods.notFound")}
          </ThemedText>
          <Button
            label={t("common:actions.goBack")}
            leftIcon="arrow-left"
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
    <ScreenLayout style={tw`flex-1 px-4 pt-8`}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <DetailHeader
          title={method.name}
          status={!method.isActive && <Label text={t("inactive")} />}
          icon={categoryIcons[method.type]}
        >
          {canManage && (
            <ThemedView style={tw`flex-row flex-wrap gap-3`}>
              {!method.isActive && (
                // Inactive: bringing it back is the main action
                <Button
                  label={t("activate")}
                  leftIcon="eye"
                  shape="rounded"
                  size="small"
                  loading={updatePaymentMethod.isPending}
                  disabled={updatePaymentMethod.isPending}
                  onPress={handleToggleActive}
                />
              )}
              <Button
                label={t("edit")}
                leftIcon="square-pen"
                variant="surface"
                shape="rounded"
                size="small"
                onPress={handleEditMethod}
              />
              <Button
                leftIcon="ellipsis"
                variant="surface"
                shape="rounded"
                size="small"
                accessibilityLabel={t("common:actions.more")}
                onPress={() => moreSheetRef.current?.present()}
              />
            </ThemedView>
          )}
        </DetailHeader>

        {/* Information: the rows say what they are, so no title */}
        <DetailCard style={tw`py-2`}>
          <ThemedView style={tw`border-b border-divider`}>
            <DetailCardRow
              label={t("methods.fields.category")}
              value={t(getPaymentMethodTranslationKey(method.type))}
            />
          </ThemedView>
          <DetailCardRow
            label={t("methods.fields.commission")}
            value={`${method.commissionPercentage}%`}
          />
        </DetailCard>

        {/* Accounts */}
        <ThemedView style={tw`gap-3 mt-4`}>
          <DetailSectionTitle
            title={t("accounts.title")}
            action={
              // With none yet, the button sits in the card instead
              canManage &&
              sortedAccounts.length > 0 && (
                <Button
                  label={t("common:actions.add")}
                  accessibilityLabel={t("methods.fields.addAccount")}
                  leftIcon="plus"
                  variant="outline"
                  size="extra-small"
                  onPress={handleAddAccount}
                />
              )
            }
          />
          <DetailCard style={tw`py-2`}>
            {sortedAccounts.length ? (
              <ThemedView>
                {sortedAccounts.map((account, index) => {
                  const isDefault =
                    method.defaultDestinationAccount?.id === account.id;
                  return (
                    <Pressable
                      key={account.id}
                      onPress={() => handleOpenAccountActions(account)}
                      disabled={!canManage}
                      accessibilityRole={canManage ? "button" : undefined}
                      style={({ pressed }) => [
                        tw`flex-row items-center gap-3 py-3 min-h-14`,
                        index < sortedAccounts.length - 1 &&
                          tw`border-b border-divider`,
                        !account.isActive && tw`opacity-50`,
                        pressed && tw`opacity-60`,
                      ]}
                    >
                      <Icon
                        name={accountIcon(account.type)}
                        size={20}
                        color={tw.color("on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-0.5`}>
                        <ThemedText numberOfLines={1}>
                          {account.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t(`accounts.types.${account.type}`)}
                        </ThemedText>
                      </ThemedView>
                      {isDefault && <Label text={t("methods.defaultLabel")} />}
                    </Pressable>
                  );
                })}
              </ThemedView>
            ) : (
              <ThemedView style={tw`items-center gap-3 py-4`}>
                <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
                  {t("accounts.noAccounts")}
                </ThemedText>
                {canManage && (
                  <Button
                    label={t("methods.fields.addAccount")}
                    leftIcon="plus"
                    variant="outline"
                    size="small"
                    onPress={handleAddAccount}
                  />
                )}
              </ThemedView>
            )}
          </DetailCard>
        </ThemedView>
      </ScrollView>

      <ThemedBottomSheetModal ref={moreSheetRef} enablePanDownToClose>
        <ActionsBottomSheet
          title={method.name}
          items={[
            // Activate lives in the header while inactive
            ...(method.isActive
              ? [
                  {
                    icon: "eye-off" as const,
                    label: t("deactivate"),
                    onPress: handleToggleActive,
                    disabled: updatePaymentMethod.isPending,
                  },
                ]
              : []),
            {
              icon: "trash",
              label: t("delete"),
              color: "text-red-600",
              onPress: () => {
                moreSheetRef.current?.dismiss();
                setDeleteVisible(true);
              },
            },
          ]}
        />
      </ThemedBottomSheetModal>

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
                icon: "square-pen",
                label: t("edit"),
                onPress: () => {
                  handleCloseAccountActions();
                  handleEditAccount(selectedAccount);
                },
              },
              {
                icon: selectedAccount.isActive ? "eye-off" : "eye",
                label: selectedAccount.isActive
                  ? t("deactivate")
                  : t("activate"),
                onPress: handleToggleAccountActive,
              },
              ...(method.defaultDestinationAccount?.id !== selectedAccount.id
                ? [
                    {
                      icon: "star" as const,
                      label: t("setDefaultAccount"),
                      onPress: handleSetDefaultAccount,
                    },
                  ]
                : []),
              ...(method.allowedDestinationAccounts.length > 1
                ? [
                    {
                      icon: "circle-x" as const,
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
    </ScreenLayout>
  );
}
