import { useEffect, useRef, useState } from "react";
import { ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { useAccounts } from "@/presentation/restaurant/hooks/useAccounts";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import type { Account } from "@/core/restaurant/models/account.model";
import type { PaymentMethod } from "@/core/restaurant/models/payment-method.model";

export default function PaymentMethodsSettingsScreen() {
  const { t } = useTranslation("paymentMethods");
  const { accounts, accountsQuery } = useAccounts();
  const { paymentMethods, paymentMethodsQuery } = usePaymentMethods();
  const { updateAccount, deleteAccount } = useAccountsManagement();
  const { updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethodsManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(
    null,
  );
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(
    null,
  );
  const accountActionsSheetRef = useRef<BottomSheetMethods>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(
    null,
  );
  const methodActionsSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (accounts.length === 0) accountsQuery.refetch();
    if (paymentMethods.length === 0) paymentMethodsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRefetching =
    accountsQuery.isRefetching || paymentMethodsQuery.isRefetching;

  const onRefresh = () => {
    accountsQuery.refetch();
    paymentMethodsQuery.refetch();
  };

  const handleCreateAccount = () => {
    router.push("/(profile)/account-form");
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

  const handleOpenAccountActions = (account: Account) => {
    setSelectedAccount(account);
    accountActionsSheetRef.current?.present();
  };

  const handleCloseAccountActions = () => {
    accountActionsSheetRef.current?.dismiss();
  };

  const handleToggleAccountActive = () => {
    if (!selectedAccount) return;
    updateAccount.mutate({
      id: selectedAccount.id,
      data: { isActive: !selectedAccount.isActive },
    });
    handleCloseAccountActions();
  };

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    await deleteAccount.mutateAsync(accountToDelete.id);
    setAccountToDelete(null);
  };

  const handleCreateMethod = () => {
    router.push("/(profile)/payment-method-form");
  };

  const handleEditMethod = (method: PaymentMethod) => {
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

  const handleOpenMethodActions = (method: PaymentMethod) => {
    setSelectedMethod(method);
    methodActionsSheetRef.current?.present();
  };

  const handleCloseMethodActions = () => {
    methodActionsSheetRef.current?.dismiss();
  };

  const handleToggleMethodActive = () => {
    if (!selectedMethod) return;
    updatePaymentMethod.mutate({
      id: selectedMethod.id,
      data: { isActive: !selectedMethod.isActive },
    });
    handleCloseMethodActions();
  };

  const handleConfirmDeleteMethod = async () => {
    if (!methodToDelete) return;
    await deletePaymentMethod.mutateAsync(methodToDelete.id);
    setMethodToDelete(null);
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        {/* Accounts */}
        <ThemedView style={tw`gap-4`}>
          <ThemedView style={tw`flex-row items-center justify-between`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText type="h4">{t("accounts.title")}</ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("accounts.subtitle")}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {accountsQuery.isLoading && (
            <ThemedView
              style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
            >
              <ActivityIndicator color={tw.color("blue-500")} />
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("loading")}
              </ThemedText>
            </ThemedView>
          )}

          {!accountsQuery.isLoading && accountsQuery.isError && (
            <ThemedView
              style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
            >
              <Ionicons
                name="alert-circle-outline"
                size={28}
                color={tw.color("red-500")}
              />
              <ThemedText type="small" style={tw`text-center text-gray-500`}>
                {t("loadError")}
              </ThemedText>
              <Button
                label={t("retry")}
                onPress={() => accountsQuery.refetch()}
                variant="outline"
                size="small"
              />
            </ThemedView>
          )}

          {!accountsQuery.isLoading &&
            !accountsQuery.isError &&
            accounts.length === 0 && (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`font-semibold`}>
                  {t("accounts.noAccounts")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-center text-gray-500`}>
                  {t("accounts.noAccountsDescription")}
                </ThemedText>
              </ThemedView>
            )}

          {accounts.length > 0 && (
            <ThemedView style={tw`gap-3`}>
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  onPress={
                    canManage
                      ? () => handleOpenAccountActions(account)
                      : undefined
                  }
                  style={!account.isActive && tw`opacity-50`}
                >
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-3 flex-1 flex-row items-center`}>
                      <Ionicons
                        name={
                          account.type === "BANK"
                            ? "business-outline"
                            : "cash-outline"
                        }
                        size={26}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-2`}>
                        <ThemedText type="body1" style={tw`font-semibold`}>
                          {account.name}
                        </ThemedText>
                        <ThemedView
                          style={tw`flex-row items-center gap-2 flex-wrap`}
                        >
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t(`accounts.types.${account.type}`)}
                          </ThemedText>
                          {account.description ? (
                            <ThemedText type="small" style={tw`text-gray-500`}>
                              • {account.description}
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    {canManage && (
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={tw.color("gray-400")}
                      />
                    )}
                  </ThemedView>
                </Card>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {canManage && (
          <Button
            label={t("accounts.newAccount")}
            onPress={handleCreateAccount}
            variant="outline"
            size="small"
            leftIcon="add-outline"
          />
        )}

        <ThemedView style={tw`my-2`} />

        {/* Payment methods */}
        <ThemedView style={tw`gap-4`}>
          <ThemedView style={tw`flex-row items-center justify-between`}>
            <ThemedView style={tw`gap-1`}>
              <ThemedText type="h4">{t("methods.title")}</ThemedText>
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("methods.subtitle")}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {paymentMethodsQuery.isLoading && (
            <ThemedView
              style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
            >
              <ActivityIndicator color={tw.color("blue-500")} />
              <ThemedText type="small" style={tw`text-gray-500`}>
                {t("loading")}
              </ThemedText>
            </ThemedView>
          )}

          {!paymentMethodsQuery.isLoading && paymentMethodsQuery.isError && (
            <ThemedView
              style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
            >
              <Ionicons
                name="alert-circle-outline"
                size={28}
                color={tw.color("red-500")}
              />
              <ThemedText type="small" style={tw`text-center text-gray-500`}>
                {t("loadError")}
              </ThemedText>
              <Button
                label={t("retry")}
                onPress={() => paymentMethodsQuery.refetch()}
                variant="outline"
                size="small"
              />
            </ThemedView>
          )}

          {!paymentMethodsQuery.isLoading &&
            !paymentMethodsQuery.isError &&
            paymentMethods.length === 0 && (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="card-outline"
                  size={32}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`font-semibold`}>
                  {t("methods.noMethods")}
                </ThemedText>
                <ThemedText type="small" style={tw`text-center text-gray-500`}>
                  {t("methods.noMethodsDescription")}
                </ThemedText>
              </ThemedView>
            )}

          {paymentMethods.length > 0 && (
            <ThemedView style={tw`gap-3`}>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  onPress={
                    canManage
                      ? () => handleOpenMethodActions(method)
                      : undefined
                  }
                  style={!method.isActive && tw`opacity-50`}
                >
                  <ThemedView style={tw`flex-row items-center justify-between`}>
                    <ThemedView style={tw`gap-3 flex-1 flex-row items-center`}>
                      <Ionicons
                        name="card-outline"
                        size={26}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-2`}>
                        <ThemedText type="body1" style={tw`font-semibold`}>
                          {method.name}
                        </ThemedText>
                        <ThemedView
                          style={tw`flex-row items-center gap-2 flex-wrap`}
                        >
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            {t(getPaymentMethodTranslationKey(method.type))}
                          </ThemedText>
                          <ThemedText type="small" style={tw`text-gray-500`}>
                            • {method.commissionPercentage}%
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    {canManage && (
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={tw.color("gray-400")}
                      />
                    )}
                  </ThemedView>
                </Card>
              ))}

              {canManage && (
                <Button
                  label={t("methods.newMethod")}
                  onPress={handleCreateMethod}
                  variant="outline"
                  size="small"
                  leftIcon="add-outline"
                />
              )}
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

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
              {
                icon: "trash-outline",
                label: t("delete"),
                color: "text-red-500",
                onPress: () => {
                  handleCloseAccountActions();
                  setAccountToDelete(selectedAccount);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>

      <ThemedBottomSheetModal ref={methodActionsSheetRef} enablePanDownToClose>
        {selectedMethod && (
          <ActionsBottomSheet
            title={selectedMethod.name}
            items={[
              {
                icon: "create-outline",
                label: t("edit"),
                onPress: () => {
                  handleCloseMethodActions();
                  handleEditMethod(selectedMethod);
                },
              },
              {
                icon: selectedMethod.isActive
                  ? "eye-off-outline"
                  : "eye-outline",
                label: selectedMethod.isActive
                  ? t("deactivate")
                  : t("activate"),
                onPress: handleToggleMethodActive,
              },
              {
                icon: "trash-outline",
                label: t("delete"),
                color: "text-red-500",
                onPress: () => {
                  handleCloseMethodActions();
                  setMethodToDelete(selectedMethod);
                },
              },
            ]}
          />
        )}
      </ThemedBottomSheetModal>

      <DialogModal
        visible={!!accountToDelete}
        title={t("accounts.deleteTitle")}
        message={t("accounts.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deleteAccount.isPending}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setAccountToDelete(null)}
      />

      <DialogModal
        visible={!!methodToDelete}
        title={t("methods.deleteTitle")}
        message={t("methods.deleteMessage")}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        confirmVariant="destructive"
        loading={deletePaymentMethod.isPending}
        onConfirm={handleConfirmDeleteMethod}
        onCancel={() => setMethodToDelete(null)}
      />
    </ScreenLayout>
  );
}
