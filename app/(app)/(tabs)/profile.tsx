import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  PressableProps,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import OrderCard from "@/presentation/home/components/order-card";
import { Ionicons } from "@expo/vector-icons";
import DialogModal from "@/presentation/theme/components/dialog-modal";
import { useState } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useGlobalStore } from "@/presentation/shared/store/useGlobalStore";
import {
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "@/core/i18n/i18n.config";
import Select from "@/presentation/theme/components/select";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Card from "@/presentation/theme/components/card";
import { typography } from "@/constants/theme";

interface CardButtonProps extends PressableProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
}

export const CardButton = ({ icon, label, onPress }: CardButtonProps) => {
  return (
    <Card onPress={onPress}>
      <ThemedView style={tw`  gap-4`}>
        <ThemedView>
          <Ionicons name={icon} size={22} />
        </ThemedView>
        <ThemedText style={[{ fontFamily: typography.medium }]}>
          {label}
        </ThemedText>
      </ThemedView>
    </Card>
  );
};

export default function OrdersScreen() {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  const { user, currentRestaurant } = useAuthStore();
  const { logout } = useAuthStore();
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  const handleLanguageChange = async (value: string | number) => {
    await setLanguage(value as LanguageCode);
  };

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw` items-center gap-2 flex-row justify-between`}>
          <ThemedText type="h2">{t("profile.title")}</ThemedText>
          <Ionicons name="settings-outline" size={22} />
        </ThemedView>
        <ThemedView style={tw`my-4`} />
        <ThemedView style={tw`items-center gap-2`}>
          <ThemedText type="h3">
            {user?.person.firstName} {user?.person.lastName}
          </ThemedText>
          <ThemedText type="h4">{currentRestaurant?.name}</ThemedText>
          <ThemedText type="body2">{user?.role?.description}</ThemedText>
        </ThemedView>
        <ThemedView style={tw`my-8`}>
          <ThemedView style={tw`rounded-lg  p-4 gap-8`}>
            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                Orders
              </ThemedText>
              <ThemedView style={tw`gap-2`}>
                <CardButton
                  icon="albums-outline"
                  label={t("profile.allOrders")}
                  onPress={() => {
                    router.push("/(profile)/all-orders");
                  }}
                />
                <CardButton
                  icon="time-outline"
                  label={t("profile.history")}
                  onPress={() => {
                    router.push("/(profile)/history");
                  }}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                Restaurant
              </ThemedText>
              <CardButton
                icon="storefront-outline"
                label={t("profile.myRestaurants")}
                onPress={() => {
                  router.push("/(profile)/restaurants");
                }}
              />
              <CardButton
                icon="cloud-offline-outline"
                label={t("profile.offlineData")}
                onPress={() => {
                  router.push("/(profile)/restaurant");
                }}
              />
            </ThemedView>
            <ThemedView style={tw`gap-4`}>
              <ThemedView style={tw`gap-2`}>
                <Select
                  label={t("profile.language")}
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
              <ThemedText>{t("profile.logout")}</ThemedText>
            </Pressable>
          </ThemedView>
          <DialogModal
            visible={visible}
            title={t("dialogs.logoutTitle")}
            message={t("dialogs.logoutMessage")}
            onCancel={() => setVisible(false)}
            onConfirm={() => {
              setVisible(false);
              logout();
            }}
          />
        </ThemedView>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
