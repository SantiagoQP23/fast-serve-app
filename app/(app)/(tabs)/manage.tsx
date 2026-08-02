import {
  StyleSheet,
  ScrollView,
  Pressable,
  PressableProps,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { router } from "expo-router";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { ScreenLayout } from "@/presentation/theme/layout/screen-layout";
import Button from "@/presentation/theme/components/button";
import { typography } from "@/constants/theme";
import Label from "@/presentation/theme/components/label";

interface CardButtonProps extends PressableProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
}

export const CardButton = ({ icon, label, onPress }: CardButtonProps) => {
  return (
    <>
      {/* <Card onPress={onPress}> */}
      <Pressable onPress={onPress}>
        <ThemedView style={tw`flex-row gap-4`}>
          <ThemedView>
            <Ionicons name={icon} size={22} />
          </ThemedView>
          <ThemedText style={[{ fontFamily: typography.medium }]}>
            {label}
          </ThemedText>
        </ThemedView>
      </Pressable>
      {/* </Card> */}
    </>
  );
};

export default function ManageScreen() {
  const { t } = useTranslation("auth");
  const { user, currentRestaurant } = useAuthStore();

  return (
    <ScreenLayout style={tw`px-4 pt-8 flex-1 gap-4`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={tw` items-center gap-2 flex-row justify-between`}>
          <ThemedText type="h2">{t("manage.title")}</ThemedText>
          <Pressable
            onPress={() => router.push("/(profile)/settings")}
            style={({ pressed }) => tw.style(pressed && "opacity-70")}
          >
            <Ionicons name="settings-outline" size={22} />
          </Pressable>
        </ThemedView>
        <ThemedView style={tw`my-4`} />
        <ThemedView style={tw`items-center gap-2`}>
          {/* <ThemedText type="h3"> */}
          {/*   {user?.person.firstName} {user?.person.lastName} */}
          {/* </ThemedText> */}
          <ThemedText type="h3">{currentRestaurant?.name}</ThemedText>
          <Label
            text={user?.role?.description || ""}
            color="default"
            size="small"
          />
        </ThemedView>
        <Button
          label={t("manage.manageOtherRestaurant")}
          onPress={() => router.push("/(profile)/restaurants")}
          variant="text"
          leftIcon="storefront-outline"
          style={tw`mt-4`}
          size="small"
        />
        <ThemedView style={tw`my-8`}>
          <ThemedView style={tw`rounded-lg  p-4 gap-8`}>
            <ThemedView style={tw`gap-4`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                Orders
              </ThemedText>
              <ThemedView style={tw`gap-6`}>
                {/* <CardButton */}
                {/*   icon="albums-outline" */}
                {/*   label={t("manage.allOrders")} */}
                {/*   onPress={() => { */}
                {/*     router.push("/(profile)/all-orders"); */}
                {/*   }} */}
                {/* /> */}
                <CardButton
                  icon="time-outline"
                  label={t("manage.history")}
                  onPress={() => {
                    router.push("/(profile)/history");
                  }}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={tw`gap-6`}>
              <ThemedText type="small" style={tw`text-gray-500`}>
                Restaurant
              </ThemedText>
              {/* <CardButton */}
              {/*   icon="storefront-outline" */}
              {/*   label={t("manage.myRestaurants")} */}
              {/*   onPress={() => { */}
              {/*     router.push("/(profile)/restaurants"); */}
              {/*   }} */}
              {/* /> */}
              <CardButton
                icon="cloud-offline-outline"
                label={t("manage.offlineData")}
                onPress={() => {
                  router.push("/(profile)/restaurant");
                }}
              />
              <CardButton
                icon="print-outline"
                label={t("manage.printers")}
                onPress={() => {
                  router.push("/(profile)/printers");
                }}
              />
            </ThemedView>
          </ThemedView>
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
