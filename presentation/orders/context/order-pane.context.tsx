import { createContext, useContext } from "react";

/**
 * True inside a list that sits next to an inline order detail pane (tablet).
 * Order cards then only select the order instead of navigating to it.
 */
export const OrderPaneContext = createContext(false);

export const useIsOrderPaneActive = () => useContext(OrderPaneContext);
