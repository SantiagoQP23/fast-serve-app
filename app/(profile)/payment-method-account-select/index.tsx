import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { usePaymentMethods } from "@/presentation/restaurant/hooks/usePaymentMethods";
import { usePaymentMethodsManagement } from "@/presentation/restaurant/hooks/usePaymentMethodsManagement";
import { useAccounts } from "@/presentation/restaurant/hooks/useAccounts";
import { useAccountsManagement } from "@/presentation/restaurant/hooks/useAccountsManagement";
import { PaymentMethodCategory } from "@/core/restaurant/models/payment-method.model";
import { AccountType } from "@/core/restaurant/models/account.model";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import TextInput from "@/presentation/theme/components/text-input";
import Select from "@/presentation/theme/components/select";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import tw from "@/presentation/theme/lib/tailwind";
import { typography } from "@/constants/theme";

const accountIcon = (type: AccountType) =>
  type === AccountType.BANK ? "business-outline" : "cash-outline";

export default function PaymentMethodAccountSelectScreen() {
  const { t } = useTranslation("paymentMethods");
  const params = useLocalSearchParams<{ methodId: string }>();

  const { paymentMethods } = usePaymentMethods();
  const { linkAccount, setDefaultAccount } = usePaymentMethodsManagement();
  const { accounts, accountsQuery } = useAccounts();
  const { createAccount } = useAccountsManagement();

  const method = paymentMethods.find(
    (candidate) => String(candidate.id) === params.methodId,
  );

  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>(
    AccountType.CASH,
  );
  const [newAccountDescription, setNewAccountDescription] = useState("");
  const [newAccountNum, setNewAccountNum] = useState("");
  const [newAccountError, setNewAccountError] = useState("");
  const newAccountSheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (accounts.length === 0) accountsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredAccountType =
    method?.type === PaymentMethodCategory.CASH
      ? AccountType.CASH
      : AccountType.BANK;

  const assignedAccountIds = new Set(
    (method?.allowedDestinationAccounts ?? []).map((account) =>
      String(account.id),
    ),
  );

  const selectableAccounts = accounts.filter(
    (account) =>
      account.type === requiredAccountType &&
      !assignedAccountIds.has(String(account.id)),
  );

  const accountTypeOptions = Object.values(AccountType)
    .filter((value) => value === requiredAccountType)
    .map((value) => ({
      label: t(`accounts.types.${value}`),
      value,
    }));

  const attachAccount = (accountId: number) => {
    if (!method) return;
    linkAccount.mutate(
      { id: method.id, accountId },
      {
        onSuccess: (updatedMethod) => {
          if (!updatedMethod.defaultDestinationAccount) {
            setDefaultAccount.mutate(
              { id: method.id, accountId },
              { onSuccess: () => router.back() },
            );
            return;
          }
          router.back();
        },
      },
    );
  };

  const openAddAccountSheet = () => {
    setNewAccountName("");
    setNewAccountType(requiredAccountType);
    setNewAccountDescription("");
    setNewAccountNum("");
    setNewAccountError("");
    newAccountSheetRef.current?.present();
  };

  const closeAddAccountSheet = () => {
    newAccountSheetRef.current?.dismiss();
  };

  const handleCreateAccountInline = async () => {
    const trimmedName = newAccountName.trim();
    if (!trimmedName) {
      setNewAccountError(t("accounts.validations.nameRequired"));
      return;
    }
    setNewAccountError("");

    const account = await createAccount.mutateAsync({
      name: trimmedName,
      description: newAccountDescription.trim() || "",
      num: newAccountNum.trim() || undefined,
      type: newAccountType,
    });

    closeAddAccountSheet();
    attachAccount(account.id);
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

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-8`}
        >
          <ThemedView style={tw`items-center gap-4 flex-row`}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => tw.style(pressed && "opacity-70")}
            >
              <Ionicons name="arrow-back-outline" size={24} />
            </Pressable>
            <ThemedText type="h3" style={{ fontFamily: typography.regular }}>
              {t("methods.selectAccount.title")}
            </ThemedText>
          </ThemedView>

          <ThemedView style={tw`my-6`} />

          <ThemedView style={tw`gap-4`}>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {t("methods.selectAccount.subtitle")}
            </ThemedText>

            {accountsQuery.isLoading ? (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <ActivityIndicator color={tw.color("blue-500")} />
                <ThemedText type="small" style={tw`text-gray-500`}>
                  {t("loading")}
                </ThemedText>
              </ThemedView>
            ) : selectableAccounts.length === 0 ? (
              <ThemedView
                style={tw`items-center py-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded-3xl px-4`}
              >
                <Ionicons
                  name="wallet-outline"
                  size={32}
                  color={tw.color("gray-400")}
                />
                <ThemedText type="body2" style={tw`font-semibold`}>
                  {t("methods.selectAccount.empty")}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={tw`text-center text-gray-500`}
                >
                  {t("methods.selectAccount.emptyDescription")}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={tw`gap-3`}>
                {selectableAccounts.map((account) => (
                  <Card
                    key={account.id}
                    onPress={() => attachAccount(account.id)}
                  >
                    <ThemedView style={tw`flex-row items-center gap-3`}>
                      <Ionicons
                        name={accountIcon(account.type)}
                        size={26}
                        color={tw.color("text-light-on-surface-variant")}
                      />
                      <ThemedView style={tw`flex-1 gap-1`}>
                        <ThemedText type="body1" style={tw`font-semibold`}>
                          {account.name}
                        </ThemedText>
                        <ThemedText type="small" style={tw`text-gray-500`}>
                          {t(`accounts.types.${account.type}`)}
                        </ThemedText>
                      </ThemedView>
                      <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color={tw.color("light-primary")}
                      />
                    </ThemedView>
                  </Card>
                ))}
              </ThemedView>
            )}

            <Button
              label={t("accounts.createAccount")}
              onPress={openAddAccountSheet}
              variant="outline"
              leftIcon="add-outline"
            />
          </ThemedView>
        </ScrollView>
      </ScreenLayout>

      <ThemedBottomSheetModal ref={newAccountSheetRef} enablePanDownToClose>
        <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
          <ThemedText type="h3">{t("accounts.createAccount")}</ThemedText>

          <Select
            label={t("accounts.fields.type")}
            options={accountTypeOptions}
            value={newAccountType}
            onChange={(v) => setNewAccountType(v as AccountType)}
            placeholder={t("accounts.placeholders.type")}
          />

          <TextInput
            bottomSheet
            label={t("accounts.fields.name")}
            placeholder={t("accounts.placeholders.name")}
            value={newAccountName}
            onChangeText={setNewAccountName}
          />

          <TextInput
            bottomSheet
            label={t("accounts.fields.description")}
            placeholder={t("accounts.placeholders.description")}
            value={newAccountDescription}
            onChangeText={setNewAccountDescription}
          />

          {newAccountType === AccountType.BANK && (
            <TextInput
              bottomSheet
              label={t("accounts.fields.num")}
              placeholder={t("accounts.placeholders.num")}
              value={newAccountNum}
              onChangeText={setNewAccountNum}
            />
          )}

          {newAccountError ? (
            <ThemedText type="small" style={tw`text-red-500`}>
              {newAccountError}
            </ThemedText>
          ) : null}

          <Button
            label={t("accounts.create")}
            onPress={handleCreateAccountInline}
            loading={
              createAccount.isPending ||
              linkAccount.isPending ||
              setDefaultAccount.isPending
            }
            disabled={
              createAccount.isPending ||
              linkAccount.isPending ||
              setDefaultAccount.isPending
            }
          />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    </KeyboardAvoidingView>
  );
}
