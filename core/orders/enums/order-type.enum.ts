export enum OrderType {
  TAKE_AWAY = "TAKE_AWAY",
  IN_PLACE = "IN_PLACE",
}

export const orderTypes = [
  { label: "In Place", value: OrderType.IN_PLACE },
  { label: "Take Away", value: OrderType.TAKE_AWAY },
];
