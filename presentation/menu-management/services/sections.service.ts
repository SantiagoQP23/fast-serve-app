import { restaurantApi } from "@/core/api/restaurantApi";
import type { Section } from "@/core/menu/models/section.model";
import type { CreateSectionDto } from "../interfaces/dto/create-section.dto";
import type { UpdateSectionDto } from "../interfaces/dto/update-section.dto";

export class SectionsService {
  static async create(data: CreateSectionDto): Promise<Section> {
    const resp = await restaurantApi.post<Section>("/sections", data);
    return resp.data;
  }

  static async update(data: UpdateSectionDto): Promise<Section> {
    const { id, ...updateData } = data;
    const resp = await restaurantApi.patch<Section>(
      `/sections/${id}`,
      updateData,
    );
    return resp.data;
  }
}
