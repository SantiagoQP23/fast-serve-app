export enum PlanLimitResource {
  TABLES = "TABLES",
  PRODUCTS = "PRODUCTS",
  USERS = "USERS",
  ORDERS_PER_MONTH = "ORDERS_PER_MONTH",
}

export interface PlanLimit {
  id: string;
  planId: number;
  resource: PlanLimitResource;
  limit: number; // -1 means unlimited
}

export interface Plan {
  id: number;
  code: string; // stable identifier, e.g. 'FREE' | 'PREMIUM'
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  limits?: PlanLimit[];
}

export interface Subscription {
  id: string;
  status:
    | "TRIAL"
    | "ACTIVE"
    | "GRACE_PERIOD"
    | "ON_HOLD"
    | "PAUSED"
    | "EXPIRED"
    | "CANCELLED";
  startDate: string;
  trialEndsAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  provider?: "GOOGLE_PLAY" | "APP_STORE" | "STRIPE" | null;
  plan?: Plan;
}

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  address: string;
  capacity: number;
  identification: string;
  phone: string;
  email: string;
  subscription?: Subscription;
}
