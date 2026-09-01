import { Pressable, View } from "react-native";
import tw from "../lib/tailwind";
import { ThemedText } from "./themed-text";
import { typography } from "@/constants/theme";
export interface TabItem<T extends string> {
  label: string;
  value: T;
  count?: number;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
}

export default function TabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: TabBarProps<T>) {
  return (
    <View style={tw`flex-row  dark:bg-slate-800 rounded-3xl p-1`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={tw.style(
              "flex-1 items-center justify-center py-2 px-1 ",
              isActive &&
                "dark:bg-slate-700  border-b-2 border-light-primary dark:border-light-primary",
            )}
          >
            <ThemedText
              type="body2"
              style={[
                tw.style(
                  isActive
                    ? "font-semibold text-light-primary dark:text-white"
                    : "text-gray-500 dark:text-gray-400",
                ),
                { fontFamily: typography.medium },
              ]}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <ThemedText
                  type="small"
                  style={[
                    tw.style(
                      "ml-1",
                      isActive
                        ? "text-light-primary dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500",
                    ),
                  ]}
                >
                  {" "}
                  {tab.count}
                </ThemedText>
              ) : null}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
