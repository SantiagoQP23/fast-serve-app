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
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isValidRole } from "@/core/auth/models/user.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import Label from "@/presentation/theme/components/label";
import IconButton from "@/presentation/theme/components/icon-button";
import Fab from "@/presentation/theme/components/fab";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import ActionsBottomSheet from "@/presentation/theme/components/actions-bottom-sheet";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import type { Account } from "@/core/restaurant/models/account.model";
import type { PaymentMethod } from "@/core/restaurant/models/payment-method.model";

const paymentMethodIcons: Record<
  PaymentMethodCategory,
  keyof typeof Ionicons.glyphMap
> = {
  [PaymentMethodCategory.CASH]: "cash-outline",
  [PaymentMethodCategory.CARD]: "card-outline",
  [PaymentMethodCategory.TRANSFER]: "swap-horizontal-outline",
  [PaymentMethodCategory.DIGITAL_WALLET]: "wallet-outline",
  [PaymentMethodCategory.OTHER]: "ellipsis-horizontal-circle-outline",
};

export default function PaymentMethodsSettingsScreen() {
  const { t } = useTranslation("paymentMethods");
  const { paymentMethods, paymentMethodsQuery } = usePaymentMethods();
  const { unlinkAccount, setDefaultAccount } = usePaymentMethodsManagement();
  const { updateAccount } = useAccountsManagement();
  const { user } = useAuthStore();
  const canManage = isValidRole(user?.role?.name, [Roles.ADMIN, Roles.OWNER]);

  const [selectedAccountContext, setSelectedAccountContext] = useState<{
    method: PaymentMethod;
    account: Account;
  } | null>(null);
  const accountActionsSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (paymentMethods.length === 0) paymentMethodsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    paymentMethodsQuery.refetch();
  };

  const handleCreateMethod = () => {
    router.push("/(profile)/payment-method-form");
  };

  const handleOpenMethodDetails = (methodId: number) => {
    router.push({
      pathname: "/(profile)/payment-method-details",
      params: { methodId: String(methodId) },
    });
  };

  const handleAddAccount = (methodId: number) => {
    router.push({
      pathname: "/(profile)/payment-method-account-select",
      params: { methodId: String(methodId) },
    });
  };

  const handleOpenAccountChipActions = (
    method: PaymentMethod,
    account: Account,
  ) => {
    setSelectedAccountContext({ method, account });
    accountActionsSheetRef.current?.present();
  };

  const handleCloseAccountChipActions = () => {
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
    if (!selectedAccountContext) return;
    const { account } = selectedAccountContext;
    updateAccount.mutate({
      id: account.id,
      data: { isActive: !account.isActive },
    });
    handleCloseAccountChipActions();
  };

  const handleSetDefaultAccount = () => {
    if (!selectedAccountContext) return;
    const { method, account } = selectedAccountContext;
    setDefaultAccount.mutate({ id: method.id, accountId: account.id });
    handleCloseAccountChipActions();
  };

  const handleRemoveAccount = () => {
    if (!selectedAccountContext) return;
    const { method, account } = selectedAccountContext;
    const remainingAccounts = method.allowedDestinationAccounts.filter(
      (candidate) => candidate.id !== account.id,
    );
    if (remainingAccounts.length === 0) return;

    const isRemovingDefault =
      method.defaultDestinationAccount?.id === account.id;

    const unlink = () =>
      unlinkAccount.mutate({ id: method.id, accountId: account.id });

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
    handleCloseAccountChipActions();
  };

  return (
    <ScreenLayout style={tw`flex-1 px-4 pt-2`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
        refreshControl={
          <RefreshControl
            refreshing={paymentMethodsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={tw.color("blue-500")}
            colors={[tw.color("blue-500") || "#3b82f6"]}
          />
        }
      >
        <ThemedView style={tw`gap-4`}>
          {/* <ThemedView style={tw`flex-row items-center justify-between`}> */}
          {/*   <ThemedView style={tw`gap-1`}> */}
          {/*     <ThemedText type="h4">{t("methods.title")}</ThemedText> */}
          {/*     <ThemedText type="small" style={tw`text-gray-500`}> */}
          {/*       {t("methods.subtitle")} */}
          {/*     </ThemedText> */}
          {/*   </ThemedView> */}
          {/* </ThemedView> */}

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
                  onPress={() => handleOpenMethodDetails(method.id)}
                  style={!method.isActive && tw`opacity-50`}
                >
                  <ThemedView style={tw`gap-3`}>
                    <ThemedView
                      style={tw`flex-row items-center justify-between`}
                    >
                      <ThemedView
                        style={tw`gap-3 flex-1 flex-row items-center`}
                      >
                        <Ionicons
                          name={paymentMethodIcons[method.type]}
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
                            {method.type === PaymentMethodCategory.CARD && (
                              <ThemedText
                                type="small"
                                style={tw`text-gray-500`}
                              >
                                • {method.commissionPercentage}%
                              </ThemedText>
                            )}
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={tw.color("gray-400")}
                      />
                    </ThemedView>

                    <ThemedView
                      style={tw`flex-row items-center gap-2 flex-wrap`}
                    >
                      {method.allowedDestinationAccounts.map((account) => (
                        <Label
                          key={account.id}
                          text={account.name}
                          size="small"
                          color={
                            method.defaultDestinationAccount?.id === account.id
                              ? "primary"
                              : "outline"
                          }
                          onPress={
                            canManage
                              ? () =>
                                  handleOpenAccountChipActions(method, account)
                              : undefined
                          }
                        />
                      ))}
                      {canManage && (
                        <IconButton
                          icon="add-circle-outline"
                          size={20}
                          variant="text"
                          onPress={() => handleAddAccount(method.id)}
                        />
                      )}
                    </ThemedView>
                  </ThemedView>
                </Card>
              ))}
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>

      {canManage && <Fab icon="add" onPress={handleCreateMethod} />}

      <ThemedBottomSheetModal ref={accountActionsSheetRef} enablePanDownToClose>
        {selectedAccountContext && (
          <ActionsBottomSheet
            title={selectedAccountContext.account.name}
            items={[
              {
                icon: "create-outline",
                label: t("edit"),
                onPress: () => {
                  handleCloseAccountChipActions();
                  handleEditAccount(selectedAccountContext.account);
                },
              },
              {
                icon: selectedAccountContext.account.isActive
                  ? "eye-off-outline"
                  : "eye-outline",
                label: selectedAccountContext.account.isActive
                  ? t("deactivate")
                  : t("activate"),
                onPress: handleToggleAccountActive,
              },
              ...(selectedAccountContext.method.defaultDestinationAccount
                ?.id !== selectedAccountContext.account.id
                ? [
                    {
                      icon: "star-outline" as const,
                      label: t("setDefaultAccount"),
                      onPress: handleSetDefaultAccount,
                    },
                  ]
                : []),
              ...(selectedAccountContext.method.allowedDestinationAccounts
                .length > 1
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
    </ScreenLayout>
  );
}
