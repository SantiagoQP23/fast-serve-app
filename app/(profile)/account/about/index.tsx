import { ScrollView } from "react-native";
import { Image } from "expo-image";
import Constants from "expo-constants";
import { openBrowserAsync } from "expo-web-browser";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Avatar from "@/presentation/theme/components/avatar";
import Button from "@/presentation/theme/components/button";
import Card from "@/presentation/theme/components/card";
import tw from "@/presentation/theme/lib/tailwind";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

const DEVELOPER = {
  name: "Santiago Quirumbay",
  githubUrl: "https://github.com/SantiagoQP23",
};

export default function AboutScreen() {
  const { t } = useTranslation("auth");
  const version = Constants.expoConfig?.version;

  return (
    <ScreenLayout style={tw`px-4 pt-4 flex-1`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`gap-4 pb-8`}
      >
        <ThemedView style={tw`items-center gap-2 py-4`}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={tw`w-20 h-20 rounded-2xl`}
          />
          <ThemedText type="h3">{Constants.expoConfig?.name}</ThemedText>
          {version && (
            <ThemedText type="small">
              {t("about.version", { version })}
            </ThemedText>
          )}
        </ThemedView>

        <Card style={tw`gap-2 p-4 rounded-3xl`}>
          <ThemedText type="body1">{t("about.appTitle")}</ThemedText>
          <ThemedText type="small">{t("about.appDescription")}</ThemedText>
        </Card>

        <Card style={tw`gap-4 p-4 rounded-3xl`}>
          <ThemedText type="caption">{t("about.developerTitle")}</ThemedText>
          <ThemedView style={tw`flex-row items-center gap-3`}>
            <Avatar name={DEVELOPER.name} size={48} />
            <ThemedView style={tw`flex-1`}>
              <ThemedText type="body1">{DEVELOPER.name}</ThemedText>
              <ThemedText type="small">{t("about.developerRole")}</ThemedText>
            </ThemedView>
          </ThemedView>
          <ThemedText type="small">{t("about.developerBio")}</ThemedText>
          <Button
            variant="surface"
            size="small"
            leftIcon="logo-github"
            label={t("about.github")}
            onPress={() => openBrowserAsync(DEVELOPER.githubUrl)}
          />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}
