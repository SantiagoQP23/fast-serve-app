import { Account } from "./account.model";

export enum PaymentMethodCategory {
  CASH = "CASH",
  CARD = "CARD",
  TRANSFER = "TRANSFER",
  DIGITAL_WALLET = "DIGITAL_WALLET",
  OTHER = "OTHER",
}

export interface PaymentMethod {
  id: number;
  name: string;
  commissionPercentage: number;
  /** CARD only: add the commission to what the customer pays (off: the restaurant absorbs it). */
  chargeCommissionToCustomer?: boolean;
  type: PaymentMethodCategory;
  allowedDestinationAccounts: Account[];
  defaultDestinationAccount?: Account;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
