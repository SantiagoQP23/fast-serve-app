import { forwardRef } from "react";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import tw from "@/presentation/theme/lib/tailwind";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import Icon from "@/presentation/theme/components/icon";
import Button from "@/presentation/theme/components/button";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";

interface InfoBottomSheetProps {
  title: string;
  message: string;
}

/**
 * Explains something without asking for a decision, e.g. why an action is
 * blocked. Opens over whatever sheet triggered it.
 */
const InfoBottomSheet = forwardRef<BottomSheetMethods, InfoBottomSheetProps>(
  ({ title, message }, ref) => {
    const { t } = useTranslation(["common"]);

    const close = () => {
      if (ref && typeof ref !== "function") ref.current?.dismiss();
    };

    return (
      <ThemedBottomSheetModal ref={ref} enablePanDownToClose>
        <BottomSheetView style={tw`px-8 pb-6 gap-6`}>
          <ThemedView style={tw`gap-3`}>
            <Icon name="info" size={80} color={tw.color("text")} />
            <ThemedView style={tw`h-2`} />
            <ThemedView style={tw`flex-row items-center gap-3`}>
              <ThemedText type="h3" style={tw`flex-1`}>
                {title}
              </ThemedText>
            </ThemedView>
            <ThemedText type="body1">{message}</ThemedText>
          </ThemedView>
          <Button label={t("common:actions.gotIt")} onPress={close} />
        </BottomSheetView>
      </ThemedBottomSheetModal>
    );
  },
);

InfoBottomSheet.displayName = "InfoBottomSheet";

export default InfoBottomSheet;
