---
target: inventory item screen
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/inventory/items/detail/index.tsx"
target_fingerprint: "sha256:4151e260271b760f477d1542c354113ffd2d75e687184216ea03398dbe628749"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/inventory/items/detail/index.tsx
timestamp: 2026-10-23T14-55-58Z
slug: app-profile-inventory-items-detail-index-tsx
---
Method: dual-agent (A: design review · B: detector). Both were resumed once after a dropped connection.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stock and status read instantly. Restock/decrease give no success feedback. |
| 2 | Match System / Real World | 3 | "Disminuir" asks for the resulting stock, not the amount to remove. "Reabastecer" is logged as "Entrada manual". |
| 3 | User Control and Freedom | 2 | No undo on adjustments. |
| 4 | Consistency and Standards | 3 | Matches count/purchase detail. The adjust counter means opposite things per mode. The footer differs from the order/bill bars. |
| 5 | Error Prevention | 2 | The edit form writes a stale stock snapshot. Delete doesn't warn about linked products. |
| 6 | Recognition Rather Than Recall | 3 | The history balance column is unlabeled, and rows don't link to their source. |
| 7 | Flexibility and Efficiency | 2 | Restock starts at 0 despite a known minimum and suggestion. No quick amounts or reasons. |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and flat. Dead pt-8 band at the top, redundant "Unidad" field, heavy + button. |
| 9 | Error Recovery | 2 | Decrease at stock ≤0 disables everything with no reason. Generic error toast. |
| 10 | Help and Documentation | 2 | "Stock Crítico" and "Sin definir" are unexplained, with no inline way to set a minimum. |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict
Mostly specific: stock as the lead figure, "Usado en" tying the item to menu options, and a day-grouped ledger with source, author and running balance. The adjust sheet (± counter, optional note, Confirmar) is generic and ignores what the app knows (minimum, suggested purchase qty, restaurant decrease reasons). Detector: 0 findings across 10 files (exit 0, also with --no-config). It reads tw`` classes but not plain style objects. There are only 5 here, all typography tokens, so nothing is hidden.

## Priority Issues
1. [P1] The edit form silently overwrites live stock with a stale snapshot. inventory-item-detail-view.tsx:80 passes quantity, form/index.tsx:96 always sends it, and backend inventory-items.service.ts:324 Object.assign writes it with no movement. Fix: drop quantity from edit mode, so stock only changes via adjust/counts. → /impeccable harden
2. [P1] The decrease sheet asks for the result, not the amount, and is a dead end at ≤0. adjust-stock-modal.tsx:74-83, 112, 116. Fix: the counter = amount to remove in both modes, the helper shows "Stock nuevo", and an inline reason + Reabastecer when stock ≤0. → /impeccable clarify
3. [P2] Restock is a blank, silent form: starts at 0, generic Confirmar, no snackbar/undo. Fix: preset the suggested qty or quick chips, "Agregar 3 unidades", and a "Stock 0 → 3 · Deshacer" snackbar. → /impeccable delight + clarify
4. [P2] The movement history is a dead end: unlabeled balance (unused detail.quantityLeft), rows not tappable, no paging. → /impeccable clarify
5. [P2] Delete doesn't warn that it unlinks N products. Fix: interpolate the count, "Eliminar" label, suggest Desactivar. → /impeccable harden

## Persona Red Flags
- Owner restocking mid-service: 12 taps from 0, no "hasta el mínimo", no receipt, and editing the minimum during service reverts stock.
- TalkBack user: the Counter ± buttons are unlabeled, the disabled Confirmar gives no reason, and the stock number and unit are separate nodes.
- Stress tester: negative stock unexplained, "Producto Opción" joined with a space, adjustments not queued offline, mutateAsync without try/catch.

## Minor Observations
- pt-8 dead band above the back arrow (inventory-item-detail-view.tsx:111).
- Footer uses border-border py-4, not divider + inset like the order/bill bars (:187).
- Text-only "Cargando...".
- "Unidad: unidades" is redundant.
- "Última actualización" uses dayjs, not formatDetailMoment.
- "Sin definir" minimum has no inline action.
- Copy drift: Stock Crítico/Crítico, Title Case "Stock Mínimo".
- Heavy grey + on "Usado en".
- The note input shows an ink border at rest in the sheet.
- Dead locale keys weeklyConsumption/totalLabel.
- Inactive items keep the full footer and hide stock status.

## Questions to Consider
- Should a critical item's primary action be "Agregar a compra" instead of a cost-less manual restock?
- Would "Alcanza para ~2 días" (from consumption data) be the real headline?
- If stock only changes through movements, why can the edit form touch it?
- Would three reason chips (Merma / Vencido / Consumo personal) turn decreases into usable waste data?
