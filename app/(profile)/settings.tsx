import { Pressable, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import {
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "@/core/i18n/i18n.config";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { router } from "expo-router";
import Label from "@/presentation/theme/components/label";
import Card from "@/presentation/theme/components/card";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

export default function SettingsScreen() {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  const { logout } = useAuthStore();
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);
  const languagePickerRef = useRef<BottomSheetPickerRef>(null);

  const handleLanguageChange = async (value: string | number) => {
    await setLanguage(value as LanguageCode);
  };

  const handleOpenLanguagePicker = useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    languagePickerRef.current?.present();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`rounded-lg p-4 gap-2 `}>
          <Card
            style={tw`gap-2 p-4 rounded-3xl`}
            onPress={() => router.push("/(profile)/account")}
          >
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="body1">{t("settings.accountTitle")}</ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
            <ThemedText type="small">
              {t("settings.accountDescription")}
            </ThemedText>
          </Card>

          <Card
            style={tw`gap-2 p-4 rounded-3xl`}
            onPress={handleOpenLanguagePicker}
          >
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="body1">{t("settings.languageTitle")}</ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
            <ThemedText type="small">
              {t("settings.languageDescription")}
            </ThemedText>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <Label text={AVAILABLE_LANGUAGES[language]} color="info" />
            </ThemedView>
          </Card>

          <BottomSheetPicker
            ref={languagePickerRef}
            title={t("settings.languageTitle")}
            options={Object.entries(AVAILABLE_LANGUAGES).map(
              ([code, name]) => ({
                value: code,
                label: name,
              }),
            )}
            value={language}
            onChange={handleLanguageChange}
          />

          <Pressable
            style={({ pressed }) =>
              tw.style(
                `flex-row items-center gap-4 bg-red-50 p-4 rounded-3xl`,
                pressed && "opacity-70",
              )
            }
            onPress={() => {
              setVisible(true);
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={tw.color(`red-600`)}
            />
            <ThemedText style={tw`text-red-800`}>
              {t("manage.logout")}
            </ThemedText>
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
