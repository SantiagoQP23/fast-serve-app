import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  CashSessionsFilter,
  CashSessionsService,
} from "@/core/cash-sessions/services/cash-sessions.service";
import {
  CashCountLine,
  CashRegister,
  isRegisterHolder,
} from "@/core/cash-sessions/models/cash-session.model";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Roles, isAdminLevelRole } from "@/core/auth/models/user.model";
import { OrderSocketEvent } from "@/core/orders/enums/socket-events.enum";
import { useWebsocketEventListener } from "@/presentation/shared/hooks/useWebsocketEventListener";
import { queryClient } from "@/app/_layout";

/** Who can open, close and take cash out of registers. */
export const useCashRoles = () => {
  const { user } = useAuthStore();
  const role = user?.role?.name;
  const isManager = isAdminLevelRole(role);
  const isCashier = role === Roles.CASHIER;
  return {
    userId: user?.id,
    isManager,
    isCashier,
    canRunRegisters: isManager || isCashier,
  };
};

export const useCashRegisters = (enabled = true) => {
  const { currentRestaurant } = useAuthStore();
  const query = useQuery({
    queryKey: ["cashRegisters", currentRestaurant?.id],
    queryFn: () => CashSessionsService.getRegisters(),
    staleTime: 15000,
    enabled: enabled && !!currentRestaurant?.id,
  });
  return {
    registers: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

/**
 * Registers a payment of `paymentMethodId` may go into, following the rule
 * in plans/apertura-cierre-caja.md (7–9): with none of the method's
 * registers open, all of them; otherwise only open ones, and a cashier only
 * the ones they run (opened, or were handed: plans/reasignar-caja.md). `null` means the rule doesn't apply (not a cash
 * method with registers).
 */
export const getAllowedRegisters = (
  registers: CashRegister[],
  paymentMethodId: number | undefined,
  userId: string | undefined,
  isCashier: boolean,
) => {
  if (!paymentMethodId) return null;
  const linked = registers.filter((r) =>
    r.paymentMethodIds.includes(paymentMethodId),
  );
  if (linked.length === 0) return null;
  const open = linked.filter((r) => r.session);
  if (open.length === 0) return { linked, allowed: linked, anyOpen: false };
  const allowed = isCashier
    ? open.filter((r) => r.session && isRegisterHolder(r.session, userId))
    : open;
  return { linked, allowed, anyOpen: true };
};

export const useAllowedRegisters = (paymentMethodId: number | undefined) => {
  const { registers, isLoading, refetch } = useCashRegisters(!!paymentMethodId);
  const { userId, isCashier } = useCashRoles();
  const result = useMemo(
    () => getAllowedRegisters(registers, paymentMethodId, userId, isCashier),
    [registers, paymentMethodId, userId, isCashier],
  );
  return { rule: result, isLoading, refetch };
};

export const useCashSession = (id: number | null) => {
  const query = useQuery({
    queryKey: ["cashSession", id],
    queryFn: () => CashSessionsService.getSession(id!),
    enabled: !!id,
    staleTime: 5000,
  });
  return {
    session: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCashSessionsHistory = (filter: CashSessionsFilter) => {
  const { currentRestaurant } = useAuthStore();
  const query = useQuery({
    queryKey: ["cashSessions", currentRestaurant?.id, filter],
    queryFn: () => CashSessionsService.getSessions(filter),
    enabled: !!currentRestaurant?.id,
  });
  return {
    sessions: query.data?.sessions ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

const invalidateCash = (client = queryClient) => {
  client.invalidateQueries({ queryKey: ["cashRegisters"] });
  client.invalidateQueries({ queryKey: ["cashSession"] });
  client.invalidateQueries({ queryKey: ["cashSessions"] });
};

export const useOpenCashSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: CashSessionsService.open,
    onSettled: () => invalidateCash(client),
  });
};

export const useCloseCashSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      countedAmount?: number;
      countedBreakdown?: CashCountLine[];
      note?: string;
    }) => CashSessionsService.close(id, data),
    onSettled: () => invalidateCash(client),
  });
};

export const useAssignableUsers = (sessionId: number) => {
  const query = useQuery({
    queryKey: ["cashSessionAssignable", sessionId],
    queryFn: () => CashSessionsService.getAssignableUsers(sessionId),
    enabled: !!sessionId,
  });
  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useReassignCashSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      toUserId: string;
      countedAmount?: number;
      countedBreakdown?: CashCountLine[];
      note?: string;
    }) => CashSessionsService.reassign(id, data),
    onSettled: () => {
      invalidateCash(client);
      client.invalidateQueries({ queryKey: ["cashSessionAssignable"] });
    },
  });
};

export const useWithdrawCash = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: CashSessionsService.withdraw,
    onSuccess: () => {
      invalidateCash(client);
      client.invalidateQueries({ queryKey: ["transactionsList"] });
    },
  });
};

export const useDepositCash = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: CashSessionsService.deposit,
    onSuccess: () => {
      invalidateCash(client);
      client.invalidateQueries({ queryKey: ["transactionsList"] });
    },
  });
};

/** Undo a register deposit or withdrawal. */
export const useCancelCashMovement = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: CashSessionsService.cancelMovement,
    onSuccess: (_, id) => {
      invalidateCash(client);
      client.invalidateQueries({ queryKey: ["transaction", id] });
      client.invalidateQueries({ queryKey: ["transactionsList"] });
    },
  });
};

/**
 * Keeps registers fresh on every device. Mount once (tabs layout): the
 * socket listener hook removes every handler of the event on unmount.
 */
export const useCashSessionsRealtime = () => {
  useWebsocketEventListener(OrderSocketEvent.cashSessionUpdated, () =>
    invalidateCash(),
  );
};
