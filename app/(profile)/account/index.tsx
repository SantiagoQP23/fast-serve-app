import { Pressable, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useRef, useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { toast } from "sonner-native";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import DeleteAccountBottomSheet from "@/presentation/auth/components/delete-account-bottom-sheet";
import { dismissNotificationAsync } from "expo-notifications";
import Button from "@/presentation/theme/components/button";

export default function AccountScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const { user, deleteAccount } = useAuthStore();
  const deleteAccountSheetRef = useRef<BottomSheetMethods>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangeEmail = () => {
    // TODO: implement change email
  };

  const handleChangePassword = () => {
    // TODO: implement change password
  };

  const handleOpenDeleteAccount = () => {
    deleteAccountSheetRef.current?.present();
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    const { success } = await deleteAccount();
    setIsDeleting(false);

    if (success) {
      toast.success(t("auth:account.deleteAccountSuccess"));
      router.replace("/auth/login");
    } else {
      toast.error(t("auth:account.deleteAccountError"));
    }
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`rounded-lg  gap-2`}>
          <Pressable
            style={({ pressed }) =>
              tw.style(
                `flex-row items-center gap-4 bg-light-surface p-4 rounded-3xl opacity-50`,
              )
            }
            disabled
            onPress={handleChangeEmail}
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color={tw.color("light-primary")}
            />
            <ThemedText type="body1" style={tw`flex-1`}>
              {t("account.changeEmail")}
            </ThemedText>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={tw.color("gray-400")}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) =>
              tw.style(
                `flex-row items-center gap-4 bg-light-surface p-4 rounded-3xl opacity-50`,
              )
            }
            onPress={handleChangePassword}
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={tw.color("light-primary")}
            />
            <ThemedText type="body1" style={tw`flex-1`}>
              {t("account.changePassword")}
            </ThemedText>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={tw.color("gray-400")}
            />
          </Pressable>

          <Button
            variant="destructive"
            label={t("account.deleteAccount")}
            leftIcon="trash-outline"
            onPress={() => {
              handleOpenDeleteAccount();
            }}
          />
        </ThemedView>

        <DeleteAccountBottomSheet
          ref={deleteAccountSheetRef}
          username={user?.username || ""}
          onConfirm={handleConfirmDeleteAccount}
          isLoading={isDeleting}
        />
      </ScrollView>
    </ScreenLayout>
  );
}
