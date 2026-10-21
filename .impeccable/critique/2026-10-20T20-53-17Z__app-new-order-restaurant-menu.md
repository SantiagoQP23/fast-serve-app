---
target: app/(new-order)/restaurant-menu/
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(new-order)/restaurant-menu"
timestamp: 2026-10-20T20-53-17Z
slug: app-new-order-restaurant-menu
---
Method: dual-agent (A: design review · B: detector)

# Critique: app/(new-order)/restaurant-menu/ (ordering menu + product detail)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Add pops back silently (product/index.tsx:387); "Ir al carrito" has no count/total (index.tsx:349); unlabeled line total (product/index.tsx:406) |
| 2 | Match System / Real World | 3 | Rail mirrors printed menu; "Agregar a carrito" grammar (es/menu.json:18); "In Place" |
| 3 | User Control and Freedom | 2 | Note can't be edited/removed once added (product/index.tsx:440-448, :577); no undo after add |
| 4 | Consistency and Standards | 2 | Three selection styles on one screen; $4.5 vs $1.00; 16px/12px radii |
| 5 | Error Prevention | 3 | Good stock math; OOS variant preselected (:104); cards don't show unavailable status; qty cap 20 |
| 6 | Recognition Rather Than Recall | 2 | No in-cart count on cards; variant prices hidden until opened |
| 7 | Flexibility and Efficiency | 1 | Every item is tap→detail→Add→back; no quick-add; identical lines never merge |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; ~45% blank on detail; two cart CTAs |
| 9 | Error Recovery | 2 | Blank no-results search; generic menu-load error |
| 10 | Help and Documentation | 2 | Mode banners help; tags unlabeled; pen icon doesn't say "custom price" |
| Total | | 22/40 | Acceptable |

## Design Specificity Verdict
Interaction partly grounded (filter rail, bottom-docked search/controls, cart-aware stock), but per-item detail round-trip with no quick-add and no in-cart state is category-generic. Detector: 0 findings across 9 files (twrnc scanning verified real); regex-only, cannot see layout/contrast/targets. Overlay n/a (native Android).

## Priority Issues
- [P1] Adding is a silent round-trip; no quick-add, no in-cart count on cards, duplicate count-less cart CTA. Fix: tap-to-add for simple items, ×N on cards, undo snackbar, single docked "Ir al carrito · N · $total", merge identical lines. Cmd: shape → animate
- [P1] Notes uneditable once saved (pointerEvents none TextInput, add-note chip hidden; product/index.tsx:440-448, :577). Fix: tappable note row reopening NoteBottomSheet + clear. Cmd: harden
- [P1] Detail composition & selection grammar: flex-1 spacer ~45% blank (:399); 5 variants in horizontal scroll, 2.5 visible, clipped stock; OOS default variant; variants ink-border, tags Label-toggle vs wash rule. Fix: wrapped filter-Chip variants with prices, section labels, tags as Chips, first in-stock default, use or remove empty space (or bottom sheet). Cmd: layout
- [P2] Menu cards: no status badge; variant names without prices incl. inactive options (product-card.tsx:73); hard-coded $ and English "No options available" (:76-77); rounded-2xl; product column overflows right gutter (index.tsx:270, :286). Cmd: polish
- [P2] Touch targets & TalkBack: chips ~34dp, tag pills ~28dp; unlabeled steppers/back/pen; no roles/selected state; empty header title. Cmd: audit → harden

## Persona Red Flags
- Casey: section tabs/rail top out of reach; cart count only in header badge; order-type chip adjacent to note chip at equal weight.
- Alex: no quick-add/repeat; lines don't merge; qty cap 20; useCounter.increment uses stale closure (useCounter.ts:14) — rapid taps dropped.
- Sam: product cards unlabeled pressables; steppers "button"; no selected state on tags/variants/chips.
- Waiter mid-rush: menu doesn't reflect ticket after interruption; uneditable notes; double-add risk.

## Minor Observations
- bg-primary-600/text-white count badge (index.tsx:366-368); rounded-xl banners (:226, :236); dead classes (product/index.tsx:400, :476)
- Blank states for no search results / empty category; no-menu state doesn't separate offline
- Custom price sheet untitled, applies live with no cancel (:628-643)
- "Buscar..." placeholder generic; gray floating gear overlay in captures (confirm dev-only)

## Questions to Consider
- What if tapping a card is the add, and the detail screen only appears when a choice is truly needed?
- Should the table's running ticket be a docked strip on the menu?
- Is order type per product really necessary, or an order-level default overridden in the cart?
