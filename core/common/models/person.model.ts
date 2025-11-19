export enum TypeIdentification {
  CEDULA = "CEDULA",
  RUC = "RUC",
}

export interface Identification {
  id: string;
  type: TypeIdentification;
  num: string;
}

export interface CreateIdentification {
  type: TypeIdentification;
  num: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  identification: Identification;
  numPhone?: string;
}
