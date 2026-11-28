import { create } from "zustand";
import type { InventoryItem } from "@/core/inventory/models/inventory-item.model";
import type { ProductRecipe } from "@/presentation/inventory/services/product-recipe.service";

/** One ingredient while the recipe is edited: amounts kept as typed. */
export interface RecipeIngredientDraft {
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  removable: boolean;
  /** Shown positive ("0.50"); saved as a negative change. */
  discount: string;
  /** Variant id → amount as typed; absent: the variant doesn't use it. */
  quantities: Record<number, string>;
}

export const fromRecipe = (recipe: ProductRecipe): RecipeIngredientDraft[] =>
  recipe.lines.map((line) => ({
    inventoryItemId: line.inventoryItemId,
    inventoryItem: line.inventoryItem,
    removable: line.removable,
    discount: Number(line.removalPriceDelta)
      ? String(Math.abs(Number(line.removalPriceDelta)))
      : "",
    quantities: Object.fromEntries(
      line.quantities.map((entry) => [
        entry.productOptionId,
        entry.quantity === null ? "" : String(Number(entry.quantity)),
      ]),
    ),
  }));

/** Compares drafts by content. */
export const snapshot = (lines: RecipeIngredientDraft[]) =>
  JSON.stringify(
    lines.map(({ inventoryItem, ...line }) => ({
      ...line,
      quantities: Object.entries(line.quantities).sort(),
    })),
  );

/** A counted insumo with a variant still waiting for its amount. */
export const needsAmount = (line: RecipeIngredientDraft) =>
  !line.inventoryItem.isUnlimited &&
  Object.values(line.quantities).some((raw) => raw.trim() === "");

/** Replace the draft with the copy, or only add what it doesn't have. */
export type RecipeCopyMode = "replace" | "add";

/** A recipe copied from another product, waiting for the recipe screen. */
export interface PendingRecipeCopy {
  sourceName: string;
  lines: RecipeIngredientDraft[];
  /** Ingredients actually added or replaced. */
  count: number;
}

/**
 * Builds the draft after copying `source` (plans/copiar-receta.md): only the
 * picked insumos, with each variant of this product taking the amounts of the
 * source variant matched to it (`variantMap`, null: copy nothing to it).
 * "add" never touches what the recipe already has. Without `canSetRemovals`
 * nothing new becomes removable and existing lines keep their setting, since
 * the server only lets owners and admins change it.
 */
export function copyRecipeLines({
  source,
  itemIds,
  variantMap,
  mode,
  canSetRemovals,
  current,
}: {
  source: ProductRecipe;
  itemIds: Set<string>;
  variantMap: Record<number, number | null>;
  mode: RecipeCopyMode;
  canSetRemovals: boolean;
  current: RecipeIngredientDraft[];
}): { lines: RecipeIngredientDraft[]; count: number } {
  const currentById = new Map(
    current.map((line) => [line.inventoryItemId, line]),
  );
  const copied: RecipeIngredientDraft[] = [];
  for (const sourceLine of fromRecipe(source)) {
    if (!itemIds.has(sourceLine.inventoryItemId)) continue;
    const existing = currentById.get(sourceLine.inventoryItemId);
    if (mode === "add" && existing) continue;
    const quantities: Record<number, string> = {};
    for (const [targetId, sourceId] of Object.entries(variantMap)) {
      if (sourceId === null) continue;
      const raw = sourceLine.quantities[sourceId];
      if (raw !== undefined) quantities[Number(targetId)] = raw;
    }
    if (!Object.keys(quantities).length) continue;
    copied.push({
      ...sourceLine,
      removable: canSetRemovals
        ? sourceLine.removable
        : (existing?.removable ?? false),
      discount: canSetRemovals
        ? sourceLine.discount
        : (existing?.discount ?? ""),
      quantities,
    });
  }
  return {
    lines: mode === "replace" ? copied : [...current, ...copied],
    count: copied.length,
  };
}

/**
 * The recipe being edited for one product. Shared by the recipe screen and
 * its insumo picker; not persisted, so leaving the recipe drops it.
 */
interface RecipeDraftState {
  productId: string | null;
  lines: RecipeIngredientDraft[] | null;
  /** Snapshot of what the server has, to tell what's unsaved. */
  saved: string | null;
  /** Active variants: the ones a newly added insumo starts on. */
  variantIds: number[];
  /**
   * Insumos picked, waiting for the recipe screen to take them. The picker
   * never edits the recipe while that screen sits underneath it: adding rows
   * to a list that isn't on screen crashes Fabric on Android.
   */
  pendingItems: InventoryItem[];
  /** New order from the reorder screen, applied the same way. */
  pendingOrder: string[] | null;
  /** A copy from another product, applied the same way. */
  pendingCopy: PendingRecipeCopy | null;
  /**
   * Fills the draft on first load, and on a reload with nothing unsaved;
   * otherwise only refreshes what the server has.
   */
  sync: (productId: string, recipe: ProductRecipe) => void;
  setLines: (
    update: (lines: RecipeIngredientDraft[]) => RecipeIngredientDraft[],
  ) => void;
  /** Queues insumos picked for the recipe screen to add. */
  queueItems: (items: InventoryItem[]) => void;
  /**
   * Adds the queued insumos on every active variant, with no amount yet, and
   * returns the ones that still need an amount.
   */
  addPending: () => RecipeIngredientDraft[];
  queueOrder: (ids: string[]) => void;
  /** Applies the queued order, if any. */
  applyPendingOrder: () => void;
  queueCopy: (copy: PendingRecipeCopy) => void;
  /** Applies the queued copy, if any, and returns it (for the toast). */
  applyPendingCopy: () => PendingRecipeCopy | null;
  markSaved: (recipe: ProductRecipe) => void;
  reset: () => void;
}

const initialState = {
  productId: null,
  lines: null,
  saved: null,
  variantIds: [],
  pendingItems: [],
  pendingOrder: null,
  pendingCopy: null,
};

export const useRecipeDraftStore = create<RecipeDraftState>()((set, get) => ({
  ...initialState,

  sync: (productId, recipe) =>
    set((state) => {
      const fresh = fromRecipe(recipe);
      const freshSnapshot = snapshot(fresh);
      const variantIds = recipe.variants
        .filter((variant) => variant.isActive)
        .map((variant) => variant.id);
      if (state.productId !== productId || state.lines === null)
        return {
          productId,
          lines: fresh,
          saved: freshSnapshot,
          variantIds,
          pendingItems: [],
          pendingOrder: null,
          pendingCopy: null,
        };
      if (
        snapshot(state.lines) === state.saved &&
        freshSnapshot !== state.saved
      )
        return { lines: fresh, saved: freshSnapshot, variantIds };
      // Unsaved edits stay, but "saved" always mirrors the server (e.g. an
      // order saved from the reorder screen).
      return { saved: freshSnapshot, variantIds };
    }),

  setLines: (update) =>
    set((state) => ({ lines: update(state.lines ?? []) })),

  queueItems: (items) => set({ pendingItems: items }),

  addPending: () => {
    const { pendingItems, lines, variantIds } = get();
    if (!pendingItems.length) return [];
    const current = lines ?? [];
    const added = pendingItems
      .filter(
        (item) => !current.some((line) => line.inventoryItemId === item.id),
      )
      .map((item) => ({
        inventoryItemId: item.id,
        inventoryItem: item,
        removable: false,
        discount: "",
        quantities: Object.fromEntries(variantIds.map((id) => [id, ""])),
      }));
    set({ lines: [...current, ...added], pendingItems: [] });
    // Unlimited insumos don't need an amount, so they skip the queue.
    return added.filter((line) => !line.inventoryItem.isUnlimited);
  },

  queueOrder: (ids) => set({ pendingOrder: ids }),

  applyPendingOrder: () => {
    const { pendingOrder, lines } = get();
    if (!pendingOrder) return;
    const position = new Map(pendingOrder.map((id, i) => [id, i]));
    set({
      pendingOrder: null,
      // Anything the order doesn't know about keeps its place at the end.
      lines: [...(lines ?? [])].sort(
        (a, b) =>
          (position.get(a.inventoryItemId) ?? pendingOrder.length) -
          (position.get(b.inventoryItemId) ?? pendingOrder.length),
      ),
    });
  },

  queueCopy: (copy) => set({ pendingCopy: copy }),

  applyPendingCopy: () => {
    const { pendingCopy } = get();
    if (!pendingCopy) return null;
    set({ lines: pendingCopy.lines, pendingCopy: null });
    return pendingCopy;
  },

  markSaved: (recipe) => {
    const fresh = fromRecipe(recipe);
    set({ lines: fresh, saved: snapshot(fresh) });
  },

  reset: () => set(initialState),
}));
