import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { AccountsService } from "@/core/restaurant/services/accounts.service";
import type { Account } from "@/core/restaurant/models/account.model";
import { useAccountsStore } from "../store/useAccountsStore";
import type { CreateAccountDto } from "../interfaces/dto/create-account.dto";
import type { UpdateAccountDto } from "../interfaces/dto/update-account.dto";

export const useAccountsManagement = () => {
  const { t } = useTranslation("paymentMethods");
  const { upsertAccount, removeAccount } = useAccountsStore();

  const createAccount = useMutation<Account, Error, CreateAccountDto>({
    mutationFn: (data) => AccountsService.create(data),
    onSuccess: (account) => {
      upsertAccount(account);
      toast.success(t("accounts.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("accounts.createError"));
    },
  });

  const updateAccount = useMutation<
    Account,
    Error,
    { id: number; data: UpdateAccountDto }
  >({
    mutationFn: ({ id, data }) => AccountsService.update(id, data),
    onSuccess: (account) => {
      upsertAccount(account);
      toast.success(t("accounts.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("accounts.updateError"));
    },
  });

  const deleteAccount = useMutation<void, Error, number>({
    mutationFn: (id) => AccountsService.remove(id),
    onSuccess: (_, id) => {
      removeAccount(id);
      toast.success(t("accounts.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("accounts.deleteError"));
    },
  });

  return {
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
