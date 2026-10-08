import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { updateUserRole } from "@/core/users/actions/user-actions";
import { UpdateUserRoleDto } from "@/core/users/dto/update-user-role.dto";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";

export const useUpdateUserRole = () => {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();

  const updateRole = useMutation({
    mutationFn: (dto: UpdateUserRoleDto) => updateUserRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, { fallback: t("staff.changeRole.error") }),
      );
    },
  });

  return { updateRole };
};
