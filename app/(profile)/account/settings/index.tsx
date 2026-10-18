import { Linking, ScrollView } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import { useOutboxStore } from "@/presentation/offline/store/useOutboxStore";
import {
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "@/core/i18n/i18n.config";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { translateErrorCode } from "@/core/api/get-error-message";
import Label from "@/presentation/theme/components/label";
import Card from "@/presentation/theme/components/card";
import Switch from "@/presentation/theme/components/switch";
import { useNotificationsStore } from "@/presentation/shared/store/useNotificationsStore";
import { useThemeStore } from "@/presentation/theme/store/useThemeStore";
import { palettes, themeSwatches, type ThemeName } from "@/constants/theme";
import BottomSheetPicker, {
  type BottomSheetPickerRef,
} from "@/presentation/theme/components/bottom-sheet-picker";

export default function SettingsScreen() {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  const [blockedVisible, setBlockedVisible] = useState(false);
  const { logout, updateLanguage } = useAuthStore();
  const language = useGlobalStore((state) => state.language);
  const languagePickerRef = useRef<BottomSheetPickerRef>(null);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const themePickerRef = useRef<BottomSheetPickerRef>(null);
  const notificationsEnabled = useNotificationsStore((state) => state.enabled);
  const setNotificationsEnabled = useNotificationsStore(
    (state) => state.setEnabled,
  );
  const notificationPermission = useNotificationsStore(
    (state) => state.permission,
  );
  const canAskAgain = useNotificationsStore((state) => state.canAskAgain);
  const requestNotificationPermission = useNotificationsStore(
    (state) => state.requestPermission,
  );
  // Once the OS stops asking, only the system settings can allow them again.
  const notificationsBlocked =
    notificationPermission === "denied" && !canAskAgain;
  const notificationsOn =
    notificationsEnabled && notificationPermission === "granted";
  // Logging out drops the changes this phone hasn't sent yet.
  const unsyncedCount = useOutboxStore((state) => state.operations.length);

  const handleLanguageChange = async (value: string | number) => {
    const { success, errorCode } = await updateLanguage(value as LanguageCode);
    if (!success) {
      toast.error(
        translateErrorCode(errorCode, t("settings.languageSaveError")),
      );
    }
  };

  const handleOpenLanguagePicker = useCallback(() => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    languagePickerRef.current?.present();
  }, []);

  // Applying a theme remounts the screens, so wait until the sheet is gone.
  const pendingThemeRef = useRef<ThemeName | null>(null);
  const handleThemeChange = (value: string | number) => {
    pendingThemeRef.current = value as ThemeName;
  };
  const handleThemePickerDismiss = () => {
    if (pendingThemeRef.current && pendingThemeRef.current !== theme) {
      setTheme(pendingThemeRef.current);
    }
    pendingThemeRef.current = null;
  };

  const handleNotificationsChange = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      return;
    }

    if (notificationPermission !== "granted") {
      if (notificationsBlocked) {
        setBlockedVisible(true);
        return;
      }

      const permission = await requestNotificationPermission();
      if (permission !== "granted") return;
    }

    setNotificationsEnabled(true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout style={tw`px-4 pt-4 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw`rounded-lg  gap-2 `}>
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
              <ThemedText type="body1">
                {t("settings.languageTitle")}
              </ThemedText>
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

          <Card
            style={tw`gap-2 p-4 rounded-3xl`}
            onPress={() => themePickerRef.current?.present()}
          >
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="body1">{t("settings.themeTitle")}</ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
            <ThemedText type="small">
              {t("settings.themeDescription")}
            </ThemedText>
            <ThemedView style={tw`flex-row items-center gap-2`}>
              <ThemedView style={tw`flex-row`}>
                {themeSwatches[theme].map((color, index) => (
                  <ThemedView
                    key={index}
                    style={[
                      tw`w-5 h-5 rounded-full border border-outline-variant`,
                      { backgroundColor: color, marginLeft: index ? -6 : 0 },
                    ]}
                  />
                ))}
              </ThemedView>
              <Label text={t(`settings.themes.${theme}`)} color="info" />
            </ThemedView>
          </Card>

          <BottomSheetPicker
            ref={themePickerRef}
            title={t("settings.themeTitle")}
            options={(Object.keys(palettes) as ThemeName[]).map((name) => ({
              value: name,
              label: t(`settings.themes.${name}`),
            }))}
            value={theme}
            onChange={handleThemeChange}
            onDismiss={handleThemePickerDismiss}
          />

          <Card style={tw`gap-2 p-4 rounded-3xl`}>
            <Switch
              label={t("settings.notificationsTitle")}
              value={notificationsOn}
              onValueChange={handleNotificationsChange}
            />
            <ThemedText type="small">
              {t("settings.notificationsDescription")}
            </ThemedText>
            {notificationsBlocked && (
              <ThemedView style={tw`flex-row items-center gap-2`}>
                <Label
                  text={t("settings.notificationsBlocked")}
                  color="warning"
                />
              </ThemedView>
            )}
          </Card>

          <Card
            style={tw`gap-2 p-4 rounded-3xl`}
            onPress={() => router.push("/(profile)/account/about")}
          >
            <ThemedView style={tw`flex-row items-center justify-between`}>
              <ThemedText type="body1">{t("settings.aboutTitle")}</ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={tw.color("gray-400")}
              />
            </ThemedView>
            <ThemedText type="small">
              {t("settings.aboutDescription")}
            </ThemedText>
          </Card>

          <Button
            variant="destructive"
            label={t("manage.logout")}
            leftIcon="log-out-outline"
            onPress={() => {
              setVisible(true);
            }}
          />
        </ThemedView>

        <DialogModal
          visible={blockedVisible}
          title={t("settings.notificationsBlockedTitle")}
          message={t("settings.notificationsBlockedMessage")}
          onCancel={() => setBlockedVisible(false)}
          onConfirm={() => {
            setBlockedVisible(false);
            Linking.openSettings();
          }}
          confirmLabel={t("settings.notificationsOpenSettings")}
        />

        <DialogModal
          visible={visible}
          title={t("dialogs.logoutTitle")}
          message={
            unsyncedCount > 0
              ? t("dialogs.logoutUnsyncedMessage", { count: unsyncedCount })
              : t("dialogs.logoutMessage")
          }
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            setVisible(false);
            handleLogout();
          }}
          confirmLabel={t("dialogs.logoutTitle")}
        />
      </ScrollView>
    </ScreenLayout>
  );
}
