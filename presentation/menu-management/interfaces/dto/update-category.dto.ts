import type { CreateCategoryDto } from "./create-category.dto";

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
  isActive?: boolean;
  isPublic?: boolean;
}
