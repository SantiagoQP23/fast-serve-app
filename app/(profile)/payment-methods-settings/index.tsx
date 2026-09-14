import { useEffect } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getPaymentMethodTranslationKey } from "@/core/i18n/utils";
import { useAccounts } from "@/presentation/restaurant/hooks/useAccounts";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import IconButton from "@/presentation/theme/components/icon-button";
import Label from "@/presentation/theme/components/label";
import type { Account } from "@/core/restaurant/models/account.model";
import type { PaymentMethod } from "@/core/restaurant/models/payment-method.model";

export default function PaymentMethodsSettingsScreen() {
  const { t } = useTranslation("paymentMethods");
  const { accounts, accountsQuery } = useAccounts();
  const { paymentMethods, paymentMethodsQuery } = usePaymentMethods();

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

          {!accountsQuery.isLoading && accounts.length === 0 && (
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
                  onPress={() => handleEditAccount(account)}
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
                          {!account.isActive && (
                            <Label
                              text={t("inactive")}
                              color="error"
                              size="small"
                            />
                          )}
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    {/* <ThemedView style={tw`flex-row items-center`}> */}
                    {/*   <IconButton */}
                    {/*     icon="create-outline" */}
                    {/*     size={18} */}
                    {/*     variant="text" */}
                    {/*     onPress={() => handleEditAccount(account)} */}
                    {/*   /> */}
                    {/* </ThemedView> */}
                  </ThemedView>
                </Card>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        <Button
          label={t("accounts.newAccount")}
          onPress={handleCreateAccount}
          variant="outline"
          size="small"
          leftIcon="add-outline"
        />

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

          {!paymentMethodsQuery.isLoading && paymentMethods.length === 0 && (
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
                <Card key={method.id} onPress={() => handleEditMethod(method)}>
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
                          {!method.isActive && (
                            <Label
                              text={t("inactive")}
                              color="error"
                              size="small"
                            />
                          )}
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                    {/* <ThemedView style={tw`flex-row items-center`}> */}
                    {/*   <IconButton */}
                    {/*     icon="create-outline" */}
                    {/*     size={18} */}
                    {/*     variant="text" */}
                    {/*     onPress={() => handleEditMethod(method)} */}
                    {/*   /> */}
                    {/* </ThemedView> */}
                  </ThemedView>
                </Card>
              ))}

              <Button
                label={t("methods.newMethod")}
                onPress={handleCreateMethod}
                variant="outline"
                size="small"
                leftIcon="add-outline"
              />
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </ScreenLayout>
  );
}
