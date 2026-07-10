import { useQuery, useMutation } from "@tanstack/react-query";
import { ProductionAreasService } from "../services/production-areas.service";
import type { CreateProductionAreaDto } from "../interfaces/dto/create-production-area.dto";
import type { UpdateProductionAreaDto } from "../interfaces/dto/update-production-area.dto";

export const useProductionAreas = () => {
  const getAllQuery = useQuery({
    queryKey: ["production-areas"],
    queryFn: () => ProductionAreasService.getAll(),
  });

  const productionAreas = getAllQuery.data ?? [];

  // const createProductionArea = useMutation<ProductionArea, ApiErrorRespDto, CreateProductionAreaDto>({
  //   mutationFn: (data: CreateProductionAreaDto) => ProductionAreasService.create(data),
  //   onSuccess: () => {
  //     toast.success("Área de producción creada correctamente");
  //     queryClient.invalidateQueries({ queryKey: ["production-areas"] });
  //   },
  //   onError: (error) => {
  //     console.log("Error creating production area", error);
  //     toast.error(error.data.message);
  //   },
  // });
  //
  // const updateProductionArea = useMutation<ProductionArea, ApiErrorRespDto, UpdateProductionAreaDto>({
  //   mutationFn: (data: UpdateProductionAreaDto) => ProductionAreasService.update(data),
  //   onSuccess: () => {
  //     toast.success("Área de producción actualizada correctamente");
  //     queryClient.invalidateQueries({ queryKey: ["production-areas"] });
  //   },
  //   onError: (error) => {
  //     console.log("Error updating production area", error);
  //     toast.error(error.data.message);
  //   },
  // });
  //
  // const deleteProductionArea = useMutation<void, ApiErrorRespDto, number>({
  //   mutationFn: (id: number) => ProductionAreasService.delete(id),
  //   onSuccess: () => {
  //     toast.success("Área de producción eliminada correctamente");
  //     queryClient.invalidateQueries({ queryKey: ["production-areas"] });
  //   },
  //   onError: (error) => {
  //     console.log("Error deleting production area", error);
  //     toast.error(error.data.message);
  //   },
  // });

  return {
    getAllQuery,
    productionAreas,
    // createProductionArea,
    // updateProductionArea,
    // deleteProductionArea,
  };
};
