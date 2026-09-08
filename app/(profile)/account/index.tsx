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
        <ThemedView style={tw`rounded-lg p-4 gap-2`}>
          <Pressable
            style={({ pressed }) =>
              tw.style(
                `flex-row items-center gap-4 bg-light-surface p-4 rounded-3xl`,
                pressed && "opacity-70",
              )
            }
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
                `flex-row items-center gap-4 bg-light-surface p-4 rounded-3xl`,
                pressed && "opacity-70",
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

          <Pressable
            style={({ pressed }) =>
              tw.style(
                `flex-row items-center gap-4 bg-red-50 p-4 rounded-3xl`,
                pressed && "opacity-70",
              )
            }
            onPress={handleOpenDeleteAccount}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={tw.color("red-600")}
            />
            <ThemedText type="body1" style={tw`flex-1 text-red-800`}>
              {t("account.deleteAccount")}
            </ThemedText>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={tw.color("red-600")}
            />
          </Pressable>
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
