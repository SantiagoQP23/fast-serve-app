import type { CreateSectionDto } from "./create-section.dto";

export interface UpdateSectionDto extends Partial<CreateSectionDto> {
  id: string;
  order?: number;
  isActive?: boolean;
  isPublic?: boolean;
}
