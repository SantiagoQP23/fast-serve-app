import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useRouter } from "expo-router";
import { DrawerActions } from "@react-navigation/native";

interface DrawerMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

export default function DrawerMenu(props: DrawerContentComponentProps) {
  const { t } = useTranslation("orders");
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor(
    { light: "#e5e7eb", dark: "#374151" },
    "border" as any,
  );
  const router = useRouter();

  const items: DrawerMenuItem[] = [
    {
      label: t("drawer.myOrders"),
      icon: "home-outline",
      route: "/(app)/(tabs)/(orders-module)/my-orders",
    },
    {
      label: t("drawer.allOrders"),
      icon: "people-outline",
      route: "/(app)/(tabs)/(orders-module)/all-orders",
    },
    {
      label: t("drawer.history"),
      icon: "time-outline",
      route: "/(app)/(tabs)/(orders-module)/history",
    },
  ];

  const handlePress = (route: string) => {
    navigation.dispatch(DrawerActions.closeDrawer());
    router.navigate(route as any);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        tw`flex-1`,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      {/* Header */}
      <ThemedView style={tw`px-5 mb-6`}>
        <ThemedText type="h3" style={tw`font-bold`}>
          {t("list.title")}
        </ThemedText>
      </ThemedView>

      {/* Divider */}
      <ThemedView
        style={[
          tw`mx-5 mb-4`,
          { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
        ]}
      />

      {/* Nav items */}
      {items.map((item) => (
        <Pressable
          key={item.route}
          onPress={() => handlePress(item.route)}
          style={({ pressed }) =>
            tw.style(
              "flex-row items-center gap-3 mx-3 px-4 py-3 rounded-xl mb-1",
              pressed && "opacity-70",
            )
          }
        >
          <Ionicons
            name={item.icon}
            size={22}
            color={textColor}
          />
          <ThemedText
            type="body1"
            style={tw`font-medium`}
          >
            {item.label}
          </ThemedText>
        </Pressable>
      ))}
    </DrawerContentScrollView>
  );
}
