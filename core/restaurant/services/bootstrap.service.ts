import { PrintersService } from "@/core/printers/services/printers.service";
import { Menu } from "@/core/menu/models/menu.model";
import { RestaurantMenuService } from "@/core/menu/services/restaurant-menu.service";
import { PaymentMethod } from "@/core/restaurant/models/payment-method.model";
import { PaymentMethodsService } from "@/core/restaurant/services/payment-methods.service";
import { Table } from "@/core/tables/models/table.model";
import { TablesService } from "@/core/tables/services/tables.service";
import { Printer } from "@/core/common/models/printer.model";

export interface BootstrapResult {
  menu: Menu;
  paymentMethods: PaymentMethod[];
  printers: Printer[];
  tables: Table[];
}

/**
 * Loads all reference data for a restaurant in parallel.
 * Used after login, token renewal, restaurant creation, or restaurant switch.
 */
export const bootstrapRestaurantData = async (
  restaurantId: string,
): Promise<BootstrapResult> => {
  const [menu, paymentMethods, printers, tables] = await Promise.all([
    RestaurantMenuService.getAllMenu(restaurantId),
    PaymentMethodsService.getPaymentMethods(),
    PrintersService.getAll(),
    TablesService.getTables(),
  ]);

  return {
    menu,
    paymentMethods,
    printers,
    tables,
  };
};
