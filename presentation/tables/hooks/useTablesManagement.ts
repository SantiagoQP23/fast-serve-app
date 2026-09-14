import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { TablesService } from "@/core/tables/services/tables.service";
import type { Table } from "@/core/tables/models/table.model";
import { useTablesStore } from "./useTablesStore";
import type { CreateTableDto } from "../interfaces/dto/create-table.dto";
import type { UpdateTableDto } from "../interfaces/dto/update-table.dto";

export const useTablesManagement = () => {
  const { t } = useTranslation("tables");
  const {
    addTable,
    updateTable: updateTableCache,
    deleteTable: deleteTableCache,
  } = useTablesStore();

  const createTable = useMutation<Table, Error, CreateTableDto>({
    mutationFn: (data) => TablesService.createTable(data),
    onSuccess: (table) => {
      addTable(table);
      toast.success(t("settings.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("settings.createError"));
    },
  });

  const updateTable = useMutation<Table, Error, UpdateTableDto>({
    mutationFn: (data) => TablesService.updateTable(data),
    onSuccess: (table) => {
      updateTableCache(table);
      toast.success(t("settings.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("settings.updateError"));
    },
  });

  const deleteTable = useMutation<void, Error, string>({
    mutationFn: (id) => TablesService.deleteTable(id),
    onSuccess: (_, id) => {
      deleteTableCache(id);
      toast.success(t("settings.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("settings.deleteError"));
    },
  });

  return {
    createTable,
    updateTable,
    deleteTable,
  };
};
