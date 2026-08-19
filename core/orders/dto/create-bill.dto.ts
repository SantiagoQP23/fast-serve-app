export interface CreateBillDetailDto {
  orderDetailId: string;
  quantity: number;
}

export interface CreateBillDto {
  idempotencyKey: string;
  orderId: string;
  clientId?: string;
  details: CreateBillDetailDto[];
  receivedAmount?: number;
  discount?: number;
  comments?: string;
}
