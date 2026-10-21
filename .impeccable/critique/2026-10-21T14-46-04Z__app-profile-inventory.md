---
target: inventory module
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/inventory"
timestamp: 2026-10-21T14-46-04Z
slug: app-profile-inventory
closed: true
---
Method: dual-agent (A: design review on emulator · B: detector + design-system greps)

# Critique — Inventory module
Scope: app/(profile)/inventory/** + presentation/inventory/components/**. 16 screens captured on emulator-5554 (es, Light).

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | −10 stock shows green "Óptimo"; hub "Crítico 0" beside red rows; count progress 2/3 list vs 3/3 detail |
| 2 | Match System / Real World | 2 | insumo/artículo/producto mixed; broken plurals; shopping list buys to minimum not par |
| 3 | User Control and Freedom | 3 | Back/Cancel/Previous/Skip work; fully answered count finishes with no review; no adjust undo |
| 4 | Consistency and Standards | 2 | Four bottom-action patterns; 13 content cards at 16–24px radii, some shadowed; dot in status badge |
| 5 | Error Prevention | 2 | Optional minimum → healthy-looking empties; "Correcto" primary in count; uncategorized items unreachable in pickers |
| 6 | Recognition Rather Than Recall | 2 | Icon-only inactive sub-tabs; no "All" chip in pickers |
| 7 | Flexibility and Efficiency | 3 | Bulk select, share list, list→purchase, typed counter; no count-this-category |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; item detail card-in-card, generic header |
| 9 | Error Recovery | 2 | Retry on load errors; negative stock never explained |
| 10 | Help and Documentation | 3 | Good inline hints, info icon, descriptive add-sheet rows |
| Total | | 24/40 | Acceptable |

## Design Specificity Verdict
Half restaurant-specific (one-at-a-time count run, recipe "Usado en", sales-linked movements, shopping list → purchase), half generic warehouse shell (folder grid, three status tiles, quantity-only purchases with no cost/supplier).
Detector: 0 findings on both dirs (exit 0, also with --no-config); canary confirmed twrnc parsing; detector does not cover RN radii/type. Greps: 13 content containers at rounded-2xl/3xl; blue-500/600 in inventory-movement-history.tsx:43-64; zero hex/Alert/Popover/non-Lucide/StyleSheet/role strings/fontSize literals. Semantic-hue flag mostly false positive (DESIGN.md sanctions it); orange bubble on shopping-list rows is decorative misuse. Overlays n/a (native).

## Priority Issues
- [P0] Stock status contradicts actual stock — getInventoryStockStatus returns optimal when minimumQuantity null/0 even at −10 (core/inventory/models/inventory-item.model.ts:35-37); rows force red at ≤0 (inventory-item-row.tsx:34-37). Fix: quantity<=0 → critical first; neutral "sin mínimo" state; align backend summary; nudge minimum on form. → harden
- [P1] Uncategorized items unreachable in purchase/count pickers (purchases/items/index.tsx:41, counts/items/index.tsx:40). Fix: default "Todos" + "Sin categoría" chips. → harden
- [P1] Count anchors on system number ("Correcto" primary) and fully-answered Finalizar commits without review (count-finish-button.tsx:42-45). Fix: counted-quantity primary or blind count; always show net-adjustment review sheet. → shape, clarify
- [P2] Four action surfaces: FloatingToolbar-as-tabs + filled "+"; "+" inconsistent per tab (inventory-content.tsx:151-161); custom rounded-3xl bar on item detail (inventory-item-detail-view.tsx:216); count detail footer + header button. Fix: labeled TabBar/SegmentedControl, one Fab per tab, real FloatingToolbar. → layout
- [P2] 6px/flat-content drift + sub-48dp icons: rounded-3xl+shadow-xs (inventory-detail-summary-card.tsx:27,33; inventory-movement-history.tsx:134; linked-products-list.tsx:44; inventory-consumption-chart.tsx:28; inventory-stock-summary.tsx:65), rounded-2xl (link-product-row.tsx:59,84; new-quantity/index.tsx:196,228; count-line-card.tsx:47; shopping-list/index.tsx:193), badge dot (inventory-detail-summary-card.tsx:66-68), bare 22–24px Pressables (inventory-content.tsx:277-285; inventory-item-detail-view.tsx:144-151). → polish

## Persona Red Flags
- Alex (weekly purchases): pickers hide uncategorized; no cost/supplier; shopping list tops to minimum; counts unnamed; no count-this-category.
- Casey (walk-in cooler): count run thumb nav excellent; "Correcto" invites skipping; unlabeled run header icons (counts/run/index.tsx:159-160); hub icons under 48dp.
- Sam: stock level color-only (inventory-item-row.tsx:19-24); folder dot color-only; unlabeled cart IconButton (purchases/items/index.tsx:95); ~34dp manage-categories (inventory-content.tsx:369-373); unlabeled inactive sub-tabs.
- Owner closing the week: summary contradicts rows; count progress logic differs (inventory-count-card.tsx:61-62 vs inventory-count-detail-view.tsx:53); no variance view.

## Minor Observations
- Plurals: locales/{es,en}/inventory.json:162-163 use _plural (ignored by i18next v25); also menuManagement, productionAreas, auth.
- "Bajo" threshold differs hub (≤min) vs shopping list (<min).
- Search: title "Inventario", top-placed not FloatingSearchBar, teal cursor, empty-state create drops typed name (search/index.tsx:50).
- Count title h1 vs h3 siblings; bold h3 hub numbers.
- Manual decreases red in movement history; in-progress count lines omit counted quantities.

## Questions to Consider
- If minimum is optional, what does "Óptimo" mean?
- Is a count verification or discovery?
- Should purchases stay quantity-only?
- Three sub-tabs, or a hub of Contar / Comprar / Faltantes?
