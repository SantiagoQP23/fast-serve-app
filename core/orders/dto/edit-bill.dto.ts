export interface EditBillDetailDto {
  orderDetailId: string;
  quantity: number;
}

export interface EditBillDto {
  billId: number;
  details: EditBillDetailDto[];
}
