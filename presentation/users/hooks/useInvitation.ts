import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { inviteUser } from "@/core/users/actions/user-actions";
import { InviteUserDto } from "@/core/users/dto/invite-user.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export const useInvitation = () => {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();

  const sendInvitation = useMutation({
    mutationFn: (dto: InviteUserDto) => inviteUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("staff.invite.success"));
    },
    onError: () => {
      toast.error(t("staff.invite.error"));
    },
  });

  return { sendInvitation };
};
