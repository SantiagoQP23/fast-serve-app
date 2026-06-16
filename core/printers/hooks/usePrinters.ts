import { useQuery } from "@tanstack/react-query";
import { PrintersService } from "../services/printers.service";

export const usePrinters = () => {
  const getAllQuery = useQuery({
    queryKey: ["printers"],
    queryFn: () => PrintersService.getAll(),
  });

  return {
    getAll: getAllQuery,
  };
};
