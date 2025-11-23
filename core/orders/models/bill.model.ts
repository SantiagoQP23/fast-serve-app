import { User } from "@/core/auth/models/user.model";
import { PaymentMethod } from "../enums/payment-method";
import { BillDetail } from "./bill.detail.model";

export interface Bill {
  id: number;
  num: number;
  comments: string;
  paymentMethod: PaymentMethod;
  receivedAmount: number;

  change: number;

  discount: number;

  total: number;

  isPaid: boolean;

  // client: IClient;

  createdBy: User;

  owner: User;

  createdAt: Date;
  updatedAt: Date;

  isActive: boolean;

  details: BillDetail[];
}
