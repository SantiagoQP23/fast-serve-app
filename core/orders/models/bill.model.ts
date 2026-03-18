import { User } from "@/core/auth/models/user.model";
import { PaymentMethod } from "../enums/payment-method";
import { BillDetail } from "./bill.detail.model";

export enum BillStatus {
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
}

export enum BillSource {
  DIRECT = "direct",
  ORDER = "order",
}

export interface Bill {
  id: number;
  num: number;
  comments: string;
  paymentMethod: PaymentMethod;
  receivedAmount: number;
  source: BillSource;

  change: number;

  discount: number;

  total: number;
  status: BillStatus;

  // client: IClient;

  createdBy: User;

  owner: User;

  createdAt: Date;
  updatedAt: Date;

  isActive: boolean;

  details: BillDetail[];
}
