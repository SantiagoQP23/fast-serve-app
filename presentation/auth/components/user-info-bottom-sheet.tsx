import { forwardRef, useRef, useImperativeHandle } from "react";
import { router } from "expo-router";
import {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { ThemedBottomSheetModal } from "@/presentation/theme/components/themed-bottom-sheet-modal";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import Avatar from "@/presentation/theme/components/avatar";
import Label from "@/presentation/theme/components/label";
import Button from "@/presentation/theme/components/button";
import tw from "@/presentation/theme/lib/tailwind";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import type { User } from "@/core/auth/models/user.model";

interface UserInfoBottomSheetProps {
  user?: User | null;
}

function UserInfoBottomSheet(
  { user }: UserInfoBottomSheetProps,
  ref: React.ForwardedRef<BottomSheetMethods>,
) {
  const { t } = useTranslation("auth");
  const bottomSheetModalRef = useRef<BottomSheetMethods>(null);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetModalRef.current?.present(),
    dismiss: () => bottomSheetModalRef.current?.dismiss(),
    snapToIndex: (index: number) =>
      bottomSheetModalRef.current?.snapToIndex?.(index),
    snapToPosition: (position: number | string) =>
      bottomSheetModalRef.current?.snapToPosition?.(position),
    expand: () => bottomSheetModalRef.current?.expand?.(),
    collapse: () => bottomSheetModalRef.current?.collapse?.(),
    close: () => bottomSheetModalRef.current?.close?.(),
    forceClose: () => bottomSheetModalRef.current?.forceClose?.(),
  }));

  const handleEditProfile = () => {
    bottomSheetModalRef.current?.dismiss();
    router.push("/(profile)/edit-profile");
  };

  return (
    <ThemedBottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
      <BottomSheetView style={tw`px-4 pb-6 pt-2 gap-4`}>
        <ThemedView style={tw`items-center gap-3`}>
          <Avatar name={user?.person?.firstName} size={64} />
          <ThemedView style={tw`items-center gap-1`}>
            <ThemedText type="body1">
              {user?.person?.firstName} {user?.person?.lastName}
            </ThemedText>
            <ThemedText type="small" style={tw`text-gray-500`}>
              {user?.person?.email}
            </ThemedText>
          </ThemedView>
          <Label
            text={user?.role?.description || ""}
            color="info"
            size="small"
          />
        </ThemedView>

        <Button
          label={t("manage.userInfo.editProfile")}
          onPress={handleEditProfile}
          leftIcon="person-circle-outline"
          variant="secondary"
        />
      </BottomSheetView>
    </ThemedBottomSheetModal>
  );
}

export default forwardRef(UserInfoBottomSheet);
