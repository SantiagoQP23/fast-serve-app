import { restaurantApi } from "@/core/api/restaurantApi";
import type { Category } from "@/core/menu/models/category.model";
import type { CreateCategoryDto } from "../interfaces/dto/create-category.dto";
import type { UpdateCategoryDto } from "../interfaces/dto/update-category.dto";

export class CategoriesService {
  static async create(data: CreateCategoryDto): Promise<Category> {
    const resp = await restaurantApi.post<Category>("/categories", data);
    return resp.data;
  }

  static async update(data: UpdateCategoryDto): Promise<Category> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<Category>(
      `/categories/${id}`,
      updateData,
    );
    return resp.data;
  }

  static async remove(id: string): Promise<void> {
    await restaurantApi.delete(`/categories/${id}`);
  }
}
