import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import type { Section } from "@/core/menu/models/section.model";
import type { Category } from "@/core/menu/models/category.model";
import type { Product } from "@/core/menu/models/product.model";
import { SectionsService } from "../services/sections.service";
import { CategoriesService } from "../services/categories.service";
import { ProductsService } from "../services/products.service";
import type { CreateSectionDto } from "../interfaces/dto/create-section.dto";
import type { UpdateSectionDto } from "../interfaces/dto/update-section.dto";
import type { CreateCategoryDto } from "../interfaces/dto/create-category.dto";
import type { UpdateCategoryDto } from "../interfaces/dto/update-category.dto";
import type { CreateProductDto } from "../interfaces/dto/create-product.dto";
import type { UpdateProductDto } from "../interfaces/dto/update-product.dto";

export const useMenuManagement = () => {
  const { t } = useTranslation("menuManagement");
  const { upsertSection, upsertCategory, removeCategory, upsertProduct } =
    useMenuStore();

  const createSection = useMutation<Section, Error, CreateSectionDto>({
    mutationFn: (data) => SectionsService.create(data),
    onSuccess: (section) => {
      upsertSection(section);
      toast.success(t("sections.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("sections.createError"));
    },
  });

  const updateSection = useMutation<Section, Error, UpdateSectionDto>({
    mutationFn: (data) => SectionsService.update(data),
    onSuccess: (section) => {
      upsertSection(section);
      toast.success(t("sections.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("sections.updateError"));
    },
  });

  const createCategory = useMutation<Category, Error, CreateCategoryDto>({
    mutationFn: (data) => CategoriesService.create(data),
    onSuccess: (category) => {
      upsertCategory(category);
      toast.success(t("categories.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("categories.createError"));
    },
  });

  const updateCategory = useMutation<Category, Error, UpdateCategoryDto>({
    mutationFn: (data) => CategoriesService.update(data),
    onSuccess: (category) => {
      upsertCategory(category);
      toast.success(t("categories.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("categories.updateError"));
    },
  });

  const deleteCategory = useMutation<void, Error, string>({
    mutationFn: (id) => CategoriesService.remove(id),
    onSuccess: (_, id) => {
      removeCategory(id);
      toast.success(t("categories.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("categories.deleteError"));
    },
  });

  const createProduct = useMutation<Product, Error, CreateProductDto>({
    mutationFn: (data) => ProductsService.create(data),
    onSuccess: (product) => {
      upsertProduct(product);
      toast.success(t("products.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("products.createError"));
    },
  });

  const updateProduct = useMutation<Product, Error, UpdateProductDto>({
    mutationFn: (data) => ProductsService.update(data),
    onSuccess: (product) => {
      upsertProduct(product);
      toast.success(t("products.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("products.updateError"));
    },
  });

  return {
    createSection,
    updateSection,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
  };
};
