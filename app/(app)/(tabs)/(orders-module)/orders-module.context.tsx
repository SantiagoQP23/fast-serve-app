import { createContext, useContext, useRef, ReactNode } from "react";
import { AnchorPosition } from "@/presentation/theme/components/popover";

type OpenViewPopoverFn = (anchor: AnchorPosition) => void;

type OrdersModuleContextValue = {
  registerOpenViewPopover: (fn: OpenViewPopoverFn) => void;
  openViewPopover: (anchor: AnchorPosition) => void;
};

const OrdersModuleContext = createContext<OrdersModuleContextValue>({
  registerOpenViewPopover: () => {},
  openViewPopover: () => {},
});

export function OrdersModuleProvider({ children }: { children: ReactNode }) {
  const openViewPopoverRef = useRef<OpenViewPopoverFn | null>(null);

  const registerOpenViewPopover = (fn: OpenViewPopoverFn) => {
    openViewPopoverRef.current = fn;
  };

  const openViewPopover = (anchor: AnchorPosition) => {
    openViewPopoverRef.current?.(anchor);
  };

  return (
    <OrdersModuleContext.Provider
      value={{ registerOpenViewPopover, openViewPopover }}
    >
      {children}
    </OrdersModuleContext.Provider>
  );
}

export default function useOrdersModuleContext() {
  return useContext(OrdersModuleContext);
}
