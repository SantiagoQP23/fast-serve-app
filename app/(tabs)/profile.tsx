import {
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
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
import { AVAILABLE_LANGUAGES, type LanguageCode } from "@/core/i18n/i18n.config";
import Select from "@/presentation/theme/components/select";

export default function OrdersScreen() {
  const { t } = useTranslation('auth');
  const [visible, setVisible] = useState(false);
  const { user, currentRestaurant } = useAuthStore();
  const { logout } = useAuthStore();
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  const handleLanguageChange = async (value: string) => {
    await setLanguage(value as LanguageCode);
  };

  return (
    <ThemedView style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="h2">{t('profile.title')}</ThemedText>
      </ThemedView>
      <ThemedView style={tw`my-4`} />
      <ThemedView style={tw`items-center gap-2`}>
        <ThemedText type="h2">
          {user?.person.firstName} {user?.person.lastName}
        </ThemedText>
        <ThemedText type="h3">{currentRestaurant?.name}</ThemedText>
        <ThemedText type="body2">{user?.role?.description}</ThemedText>
      </ThemedView>
      <ThemedView style={tw`mt-8`}>
        <ThemedView style={tw`rounded-lg  p-4 gap-8`}>
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {
              router.push("/(profile)/restaurants");
            }}
          >
            <Ionicons name="storefront-outline" size={20} />
            <ThemedText type="h4">{t('profile.myRestaurants')}</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {}}
          >
            <Ionicons name="person-outline" size={20} />
            <ThemedText type="h4">{t('profile.myProfile')}</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) =>
              tw.style(`flex-row items-center gap-4`, pressed && "opacity-70")
            }
            onPress={() => {}}
          >
            <Ionicons name="settings-outline" size={24} />
            <ThemedText type="h4">{t('profile.settings')}</ThemedText>
          </Pressable>
          <ThemedView style={tw`gap-2`}>
            <Select
              label={t('profile.language')}
              options={Object.entries(AVAILABLE_LANGUAGES).map(([code, name]) => ({
                value: code,
                label: name,
              }))}
              value={language}
              onChange={handleLanguageChange}
            />
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
            <ThemedText type="h4">{t('profile.logout')}</ThemedText>
          </Pressable>
        </ThemedView>
        <DialogModal
          visible={visible}
          title={t('dialogs.logoutTitle')}
          message={t('dialogs.logoutMessage')}
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            setVisible(false);
            logout();
          }}
        />
      </ThemedView>
    </ThemedView>
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
