export interface CreateBillDetailDto {
  orderDetailId: string;
  quantity: number;
}

export interface CreateBillDto {
  orderId: string;
  clientId?: string;
  details: CreateBillDetailDto[];
  receivedAmount?: number;
  discount?: number;
  comments?: string;
}
