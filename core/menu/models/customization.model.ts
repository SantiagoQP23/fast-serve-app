import type { Product } from "./product.model";

/**
 * Product customization (plans/personalizacion-productos.md): shared groups
 * of options ("Sabor", "Extras de mariscos") and the items a product
 * includes ("Arroz", "Patacones"). The price math mirrors the backend's
 * CustomizationService so the total the waiter sees is the one saved.
 */

export interface CustomizationInventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  /** Added to the unit price. Zero or more. */
  priceDelta: number;
  order: number;
  isActive: boolean;
  inventoryItemId: string | null;
  /** Amount of the insumo spent per unit of the line. */
  inventoryQuantity: number | null;
  inventoryItem: CustomizationInventoryItem | null;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  minSelect: number;
  /** Null: no limit. */
  maxSelect: number | null;
  isActive: boolean;
  modifiers: ModifierOption[];
  /** Admin list only: products that use the group. */
  productIds?: string[];
}

/**
 * A variant's own rule for a group on its product
 * (plans/limites-por-variante.md). Null limits keep the product's.
 */
export interface VariantGroupRule {
  productOptionId: number;
  minSelect: number | null;
  maxSelect: number | null;
  /** False: the group isn't offered on this variant. */
  isOffered: boolean;
}

/** A group on a product. Null limits keep the group's own. */
export interface ProductModifierGroup {
  id: string;
  groupId: string;
  order: number;
  minSelect: number | null;
  maxSelect: number | null;
  /** Variants with their own rule; absent from older servers. */
  variants?: VariantGroupRule[];
  group: ModifierGroup | null;
}

type VariantId = number | null | undefined;

const firstSet = (...values: (number | null | undefined)[]) =>
  values.find((value) => value !== null && value !== undefined) ?? null;

/**
 * Effective rule of a linked group: the variant's own, else the product's,
 * else the group's, each limit on its own (the server's groupLimits).
 */
export function getLinkLimits(
  link: Pick<ProductModifierGroup, "minSelect" | "maxSelect" | "variants">,
  group: Pick<ModifierGroup, "minSelect" | "maxSelect">,
  variantId?: VariantId,
): { min: number; max: number | null; offered: boolean } {
  const rule =
    variantId !== null && variantId !== undefined
      ? link.variants?.find((entry) => entry.productOptionId === variantId)
      : undefined;
  return {
    min: firstSet(rule?.minSelect, link.minSelect, group.minSelect) ?? 0,
    max: firstSet(rule?.maxSelect, link.maxSelect, group.maxSelect),
    offered: rule?.isOffered ?? true,
  };
}

export interface ProductComponent {
  id: string;
  name: string;
  removable: boolean;
  /** Zero or negative: what removing it takes off the price. */
  removalPriceDelta: number;
  order: number;
  inventoryItemId: string | null;
  inventoryQuantity: number | null;
  inventoryItem: CustomizationInventoryItem | null;
}

export type OrderDetailModifierKind = "CHOICE" | "EXTRA" | "REMOVED";

/** Frozen copy of one customization on an order or sale line. */
export interface OrderDetailModifier {
  id?: string;
  kind: OrderDetailModifierKind;
  groupName: string | null;
  name: string;
  quantity?: number;
  priceDelta: number;
  order?: number;
  groupId?: string | null;
  modifierId?: string | null;
  componentId?: string | null;
}

/** What the waiter picked; sent to the server as `customization`. */
export interface CustomizationSelection {
  modifierIds: string[];
  removedComponentIds: string[];
}

export const EMPTY_SELECTION: CustomizationSelection = {
  modifierIds: [],
  removedComponentIds: [],
};

/** A product's group as the order screen shows it. */
export interface ActiveGroup {
  linkId: string;
  group: ModifierGroup;
  min: number;
  max: number | null;
  /** Active options, in order. */
  options: ModifierOption[];
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

/**
 * Active groups of the product, in order, with their effective limits. With
 * a variant, its own rules apply and groups it doesn't offer are left out.
 */
export function getActiveGroups(
  product: Product | null | undefined,
  variantId?: VariantId,
): ActiveGroup[] {
  return [...(product?.modifierGroups ?? [])]
    .filter((link) => link.group?.isActive)
    .sort(byOrder)
    .map((link) => {
      const group = link.group as ModifierGroup;
      const { min, max, offered } = getLinkLimits(link, group, variantId);
      return {
        linkId: link.id,
        group,
        min,
        max,
        offered,
        options: [...(group.modifiers ?? [])]
          .filter((option) => option.isActive)
          .sort(byOrder),
      };
    })
    .filter((group) => group.offered && group.options.length > 0)
    .map(({ offered: _offered, ...group }) => group);
}

export function getProductComponents(
  product: Product | null | undefined,
): ProductComponent[] {
  return [...(product?.components ?? [])].sort(byOrder);
}

/** True when the product has anything the waiter can pick or remove. */
export function hasCustomization(product: Product | null | undefined): boolean {
  return (
    getActiveGroups(product).length > 0 ||
    getProductComponents(product).some((component) => component.removable)
  );
}

/** True when a one-tap add isn't enough: some group must be answered. */
export function hasRequiredGroups(
  product: Product | null | undefined,
  variantId?: VariantId,
): boolean {
  return getActiveGroups(product, variantId).some((group) => group.min > 0);
}

/** An option whose insumo can't cover one more unit. */
export function isModifierOutOfStock(option: ModifierOption): boolean {
  if (!option.inventoryItem || !option.inventoryQuantity) return false;
  return Number(option.inventoryItem.quantity) < Number(option.inventoryQuantity);
}

/**
 * Picks the option in its group: replaces the current pick when the group
 * allows one, toggles it otherwise (never beyond the maximum).
 */
export function toggleModifier(
  selection: CustomizationSelection,
  group: ActiveGroup,
  optionId: string,
): CustomizationSelection {
  const groupIds = new Set(group.options.map((option) => option.id));
  const picked = selection.modifierIds.includes(optionId);
  if (group.max === 1) {
    const others = selection.modifierIds.filter((id) => !groupIds.has(id));
    return {
      ...selection,
      modifierIds: picked && group.min === 0 ? others : [...others, optionId],
    };
  }
  if (picked)
    return {
      ...selection,
      modifierIds: selection.modifierIds.filter((id) => id !== optionId),
    };
  const inGroup = selection.modifierIds.filter((id) => groupIds.has(id));
  if (group.max !== null && inGroup.length >= group.max) return selection;
  return { ...selection, modifierIds: [...selection.modifierIds, optionId] };
}

export function toggleComponent(
  selection: CustomizationSelection,
  componentId: string,
): CustomizationSelection {
  const removed = selection.removedComponentIds.includes(componentId);
  return {
    ...selection,
    removedComponentIds: removed
      ? selection.removedComponentIds.filter((id) => id !== componentId)
      : [...selection.removedComponentIds, componentId],
  };
}

/** Drops picks the product (or a changed menu) no longer offers. */
export function cleanSelection(
  product: Product | null | undefined,
  selection: CustomizationSelection,
  variantId?: VariantId,
): CustomizationSelection {
  const optionIds = new Set(
    getActiveGroups(product, variantId).flatMap((group) =>
      group.options.map((o) => o.id),
    ),
  );
  const componentIds = new Set(
    getProductComponents(product)
      .filter((component) => component.removable)
      .map((component) => component.id),
  );
  return {
    modifierIds: selection.modifierIds.filter((id) => optionIds.has(id)),
    removedComponentIds: selection.removedComponentIds.filter((id) =>
      componentIds.has(id),
    ),
  };
}

/**
 * Fits the picks to another variant's rules: picks in groups it doesn't
 * offer go, and a group over its new maximum keeps the earliest picks.
 * Returns the names of the options dropped, for a short notice.
 */
export function fitSelectionToVariant(
  product: Product | null | undefined,
  selection: CustomizationSelection,
  variantId: VariantId,
): { selection: CustomizationSelection; dropped: string[] } {
  const keep = new Set<string>();
  for (const group of getActiveGroups(product, variantId)) {
    const ids = new Set(group.options.map((option) => option.id));
    const inGroup = selection.modifierIds.filter((id) => ids.has(id));
    const allowed = group.max === null ? inGroup : inGroup.slice(0, group.max);
    allowed.forEach((id) => keep.add(id));
  }
  // Only options the product still offers count as dropped by the variant;
  // gone or paused ones leave quietly, as before.
  const names = new Map(
    getActiveGroups(product).flatMap((group) =>
      group.options.map((option) => [option.id, option.name]),
    ),
  );
  const dropped = selection.modifierIds
    .filter((id) => !keep.has(id) && names.has(id))
    .map((id) => names.get(id) as string);
  const cleaned = cleanSelection(product, selection, variantId);
  return {
    selection: {
      ...cleaned,
      modifierIds: cleaned.modifierIds.filter((id) => keep.has(id)),
    },
    dropped,
  };
}

/** True when some linked group has a rule of its own on a variant. */
export function hasVariantRules(link: {
  variants?: VariantGroupRule[];
}): boolean {
  return (link.variants ?? []).length > 0;
}

/** Frozen rows for the selection, in print order (like the server's). */
export function buildModifierRows(
  product: Product | null | undefined,
  selection: CustomizationSelection,
  variantId?: VariantId,
): OrderDetailModifier[] {
  const picked = new Set(selection.modifierIds);
  const removed = new Set(selection.removedComponentIds);
  const rows: OrderDetailModifier[] = [];
  for (const group of getActiveGroups(product, variantId)) {
    for (const option of group.options) {
      if (!picked.has(option.id)) continue;
      rows.push({
        kind: group.max === 1 ? "CHOICE" : "EXTRA",
        groupName: group.group.name,
        name: option.name,
        quantity: 1,
        priceDelta: Number(option.priceDelta),
        groupId: group.group.id,
        modifierId: option.id,
        componentId: null,
      });
    }
  }
  for (const component of getProductComponents(product)) {
    if (!removed.has(component.id) || !component.removable) continue;
    rows.push({
      kind: "REMOVED",
      groupName: null,
      name: component.name,
      quantity: 1,
      priceDelta: Number(component.removalPriceDelta),
      groupId: null,
      modifierId: null,
      componentId: component.id,
    });
  }
  return rows.map((row, index) => ({ ...row, order: index }));
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Sum of the rows' price changes. */
export function getModifiersTotal(rows: OrderDetailModifier[] | undefined): number {
  return round2(
    (rows ?? []).reduce((sum, row) => sum + Number(row.priceDelta ?? 0), 0),
  );
}

/** Variant price plus every customization (the server's formula). */
export function calculateUnitPrice(
  basePrice: number,
  rows: OrderDetailModifier[] | undefined,
): number {
  return round2(Number(basePrice) + getModifiersTotal(rows));
}

export interface SelectionProblem {
  groupName: string;
  min: number;
}

/** First required group the selection doesn't complete, if any. */
export function getSelectionProblem(
  product: Product | null | undefined,
  selection: CustomizationSelection,
  variantId?: VariantId,
): SelectionProblem | null {
  const picked = new Set(selection.modifierIds);
  for (const group of getActiveGroups(product, variantId)) {
    const count = group.options.filter((option) => picked.has(option.id)).length;
    if (count < group.min) return { groupName: group.group.name, min: group.min };
  }
  return null;
}

/** Selection that a line's frozen rows stand for (for editing it again). */
export function selectionFromRows(
  rows: OrderDetailModifier[] | undefined,
): CustomizationSelection {
  return {
    modifierIds: (rows ?? [])
      .filter((row) => row.kind !== "REMOVED" && row.modifierId)
      .map((row) => row.modifierId as string),
    removedComponentIds: (rows ?? [])
      .filter((row) => row.kind === "REMOVED" && row.componentId)
      .map((row) => row.componentId as string),
  };
}

/** Comparable form (order-independent), like the backend's customizationKey. */
export function customizationKey(rows: OrderDetailModifier[] | undefined): string {
  return (rows ?? [])
    .map((row) => `${row.kind}:${row.groupName ?? ""}:${row.name}`)
    .sort()
    .join("|");
}

export function sortedRows(
  rows: OrderDetailModifier[] | null | undefined,
): OrderDetailModifier[] {
  return [...(rows ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export interface ModifierLineLabels {
  /** Prefix for removed items, e.g. "SIN" / "NO". */
  without: string;
}

/**
 * One short line per customization: "Sabor: Mora", "+ Extra camarón",
 * "SIN chifles". Used by cards, tickets and receipts.
 */
export function formatModifierLines(
  rows: OrderDetailModifier[] | null | undefined,
  labels: ModifierLineLabels,
): string[] {
  return sortedRows(rows).map((row) => {
    if (row.kind === "REMOVED") return `${labels.without} ${row.name}`;
    if (row.kind === "CHOICE" && row.groupName)
      return `${row.groupName}: ${row.name}`;
    return `+ ${row.name}`;
  });
}

/** `customization` as the server takes it on a line. */
export interface LineCustomizationPayload {
  modifierIds: string[];
  removedComponentIds: string[];
  customPrice?: boolean;
  snapshot: OrderDetailModifier[];
}

/** Rows a payload stands for (lines built on the phone). */
export const rowsFromPayload = (
  payload: LineCustomizationPayload | undefined,
): OrderDetailModifier[] | undefined =>
  payload?.snapshot.map((row, index) => ({ ...row, quantity: 1, order: index }));

/** Payload the server expects on a line, with the offline copy. */
export function toCustomizationPayload(
  selection: CustomizationSelection | undefined,
  rows: OrderDetailModifier[] | undefined,
  customPrice: boolean,
): LineCustomizationPayload | undefined {
  if (!selection) return undefined;
  return {
    modifierIds: selection.modifierIds,
    removedComponentIds: selection.removedComponentIds,
    ...(customPrice && { customPrice: true }),
    snapshot: (rows ?? []).map((row) => ({
      kind: row.kind,
      groupName: row.groupName,
      name: row.name,
      priceDelta: row.priceDelta,
      groupId: row.groupId ?? null,
      modifierId: row.modifierId ?? null,
      componentId: row.componentId ?? null,
    })),
  };
}

/** The `customization` of a cart line, or undefined when it has none. */
export const lineCustomization = (line: {
  customization?: CustomizationSelection;
  modifiers?: OrderDetailModifier[];
  customPrice?: boolean;
}): LineCustomizationPayload | undefined =>
  toCustomizationPayload(line.customization, line.modifiers, !!line.customPrice);
