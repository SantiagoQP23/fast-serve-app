export interface LinkProductOptionDto {
  productOptionId: number;
  quantity: number;
}

export interface LinkProductOptionsDto {
  lines: LinkProductOptionDto[];
}
