import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { removeUserFromRestaurant } from "@/core/users/actions/user-actions";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";

export const useRemoveUser = () => {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();

  const removeUser = useMutation({
    mutationFn: (userId: string) => removeUserFromRestaurant(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("staff.removeUser.success"));
    },
    onError: () => {
      toast.error(t("staff.removeUser.error"));
    },
  });

  return { removeUser };
};
