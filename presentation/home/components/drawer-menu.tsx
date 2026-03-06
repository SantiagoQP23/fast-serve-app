import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface DrawerMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  routeName: string;
}

export default function DrawerMenu(props: DrawerContentComponentProps) {
  const { t } = useTranslation("orders");
  const { navigation, state } = props;
  const insets = useSafeAreaInsets();
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor(
    { light: "#e5e7eb", dark: "#374151" },
    "border" as any,
  );

  const items: DrawerMenuItem[] = [
    {
      label: t("drawer.myOrders"),
      icon: "home-outline",
      routeName: "my-orders",
    },
    {
      label: t("drawer.allOrders"),
      icon: "people-outline",
      routeName: "all-orders",
    },
    {
      label: t("drawer.history"),
      icon: "time-outline",
      routeName: "history",
    },
  ];

  const currentRouteName = state.routes[state.index]?.name;

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
      {items.map((item) => {
        const active = currentRouteName === item.routeName;
        return (
          <Pressable
            key={item.routeName}
            onPress={() => navigation.navigate(item.routeName)}
            style={({ pressed }) =>
              tw.style(
                "flex-row items-center gap-3 mx-3 px-4 py-3 rounded-xl mb-1",
                active && "bg-light-primary/10",
                pressed && "opacity-70",
              )
            }
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={active ? primaryColor : textColor}
            />
            <ThemedText
              type="body1"
              style={[
                tw`font-medium`,
                active && { color: primaryColor },
              ]}
            >
              {item.label}
            </ThemedText>
            {active && (
              <ThemedView style={tw`flex-1 items-end bg-transparent`}>
                <ThemedView
                  style={[
                    tw`w-1.5 h-1.5 rounded-full`,
                    { backgroundColor: primaryColor },
                  ]}
                />
              </ThemedView>
            )}
          </Pressable>
        );
      })}
    </DrawerContentScrollView>
  );
}
