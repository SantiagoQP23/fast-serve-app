import { Pressable, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import {
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "@/core/i18n/i18n.config";
import Select from "@/presentation/theme/components/select";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  const { logout } = useAuthStore();
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  const handleLanguageChange = async (value: string | number) => {
    await setLanguage(value as LanguageCode);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`rounded-lg p-4 gap-8`}>
          <ThemedView style={tw`gap-4`}>
            <ThemedView style={tw`gap-2`}>
              <Select
                label={t("manage.language")}
                options={Object.entries(AVAILABLE_LANGUAGES).map(
                  ([code, name]) => ({
                    value: code,
                    label: name,
                  }),
                )}
                value={language}
                onChange={handleLanguageChange}
              />
            </ThemedView>
          </ThemedView>

          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {
              setVisible(true);
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="red" />
            <ThemedText>{t("manage.logout")}</ThemedText>
          </Pressable>
        </ThemedView>

        <DialogModal
          visible={visible}
          title={t("dialogs.logoutTitle")}
          message={t("dialogs.logoutMessage")}
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            setVisible(false);
            handleLogout();
          }}
        />
      </ScrollView>
    </ScreenLayout>
  );
}
