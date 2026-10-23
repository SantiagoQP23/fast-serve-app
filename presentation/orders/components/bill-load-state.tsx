import { ActivityIndicator } from "react-native";

import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import Button from "@/presentation/theme/components/button";
import Icon, { type IconName } from "@/presentation/theme/components/icon";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import tw from "@/presentation/theme/lib/tailwind";

interface BillLoadStateProps {
  /** Still fetching the bill for the first time. */
  isLoading?: boolean;
  /** The fetch failed; `error` decides between "not found" and "try again". */
  error?: unknown;
  onRetry?: () => void;
  /** Overrides the message, e.g. when the bill exists but can't be used here. */
  title?: string;
  description?: string;
  icon?: IconName;
}

const isNotFound = (error: unknown) =>
  (error as { response?: { status?: number } } | undefined)?.response
    ?.status === 404;

/**
 * Stands in for a bill screen while the bill loads, or when it can't be shown:
 * not found (deleted elsewhere), failed to load (with a retry), or a custom
 * reason passed by the screen.
 */
export default function BillLoadState({
  isLoading = false,
  error,
  onRetry,
  title,
  description,
  icon,
}: BillLoadStateProps) {
  const { t } = useTranslation(["bills", "common"]);

  if (isLoading) {
    return (
      <ThemedView style={tw`flex-1 justify-center items-center bg-background`}>
        <ActivityIndicator color={tw.color("primary")} />
      </ThemedView>
    );
  }

  const failedToLoad = !!error && !isNotFound(error);

  return (
    <ThemedView
      style={tw`flex-1 justify-center items-center px-8 gap-4 bg-background`}
    >
      <Icon
        name={icon ?? (failedToLoad ? "wifi-off" : "receipt-text")}
        size={40}
        color={tw.color("gray-500")}
      />
      <ThemedView style={tw`items-center gap-1`}>
        <ThemedText type="h4" style={tw`text-center`}>
          {title ??
            (failedToLoad
              ? t("bills:loadState.errorTitle")
              : t("bills:loadState.notFoundTitle"))}
        </ThemedText>
        <ThemedText type="body2" style={tw`text-gray-500 text-center`}>
          {description ??
            (failedToLoad
              ? t("bills:loadState.errorDescription")
              : t("bills:loadState.notFoundDescription"))}
        </ThemedText>
      </ThemedView>
      {failedToLoad && onRetry && (
        <Button
          label={t("bills:loadState.retry")}
          leftIcon="refresh-cw"
          variant="outline"
          size="small"
          onPress={onRetry}
        />
      )}
    </ThemedView>
  );
}
