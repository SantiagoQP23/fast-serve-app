import { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

interface SubscriptionPaywallBottomSheetProps {
  onDismiss: () => void;
}

const SubscriptionPaywallBottomSheet = ({
  onDismiss,
}: SubscriptionPaywallBottomSheetProps) => {
  const { t } = useTranslation("auth");
  const router = useRouter();

  const goToPlans = () => {
    onDismiss();
    router.push("/(profile)/subscription");
  };

  return (
    <BottomSheetView style={tw`flex-1 px-6 pt-12 items-center gap-4`}>
      <ThemedView
        style={tw`w-20 h-20 rounded-full bg-light-primary/10 items-center justify-center`}
      >
        <Ionicons
          name="lock-closed-outline"
          size={36}
          color={tw.color("light-primary")}
        />
      </ThemedView>
      <ThemedText type="h2" style={tw`text-center`}>
        {t("manage.subscription.paywall.title")}
      </ThemedText>
      <ThemedText type="body1" style={tw`text-center text-gray-500`}>
        {t("manage.subscription.paywall.message")}
      </ThemedText>
      <ThemedView style={tw`w-full gap-2 mt-auto pb-8`}>
        <Button
          label={t("manage.subscription.paywall.cta")}
          onPress={goToPlans}
        />
        <Button
          label={t("manage.subscription.paywall.dismiss")}
          variant="text"
          onPress={onDismiss}
        />
      </ThemedView>
    </BottomSheetView>
  );
};

export default SubscriptionPaywallBottomSheet;
