import { PrintersService } from "@/core/printers/services/printers.service";
import { Menu } from "@/core/menu/models/menu.model";
import { ProductionArea } from "@/core/menu/models/producion-area.model";
import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { PaymentMethodsService } from "@/core/restaurant/services/payment-methods.service";
import { Table } from "@/core/tables/models/table.model";
import { TablesService } from "@/core/tables/services/tables.service";
import { Printer } from "@/core/common/models/printer.model";
import { ProductionAreasService } from "@/presentation/production-areas/services/production-areas.service";

export interface BootstrapResult {
  menu?: Menu;
  paymentMethods?: PaymentMethod[];
  productionAreas?: ProductionArea[];
  printers?: Printer[];
  tables?: Table[];
  /** Errors from the requests that failed. Empty when everything loaded. */
  errors: unknown[];
}

const valueOf = <T>(
  result: PromiseSettledResult<T>,
  errors: unknown[],
): T | undefined => {
  if (result.status === "fulfilled") return result.value;
  errors.push(result.reason);
  return undefined;
};

/**
 * Loads all reference data for a restaurant in parallel.
 * Used after login, token renewal, restaurant creation, or restaurant switch.
 *
 * Each resource is loaded independently, so one failing request does not
 * prevent the others (e.g. payment methods) from being stored.
 */
export const bootstrapRestaurantData = async (
  restaurantId: string,
): Promise<BootstrapResult> => {
  const [menu, paymentMethods, productionAreas, printers, tables] =
    await Promise.allSettled([
      RestaurantMenuService.getAllMenu(restaurantId),
      PaymentMethodsService.getPaymentMethods(),
      ProductionAreasService.getAll(),
      PrintersService.getAll(),
      TablesService.getTables(),
    ]);

  const errors: unknown[] = [];

  return {
    menu: valueOf(menu, errors),
    paymentMethods: valueOf(paymentMethods, errors),
    productionAreas: valueOf(productionAreas, errors),
    printers: valueOf(printers, errors),
    tables: valueOf(tables, errors),
    errors,
  };
};
