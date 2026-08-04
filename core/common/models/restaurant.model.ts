export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  isActive: boolean;
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
