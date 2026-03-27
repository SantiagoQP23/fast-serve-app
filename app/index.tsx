import { ROUTES } from "@/constants/routes";
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href={ROUTES.APP.MY_ORDERS} />;
}
