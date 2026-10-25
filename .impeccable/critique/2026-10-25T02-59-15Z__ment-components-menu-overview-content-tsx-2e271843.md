---
target: menu tab of the products module
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/presentation/menu-management/components/menu-overview-content.tsx"
target_fingerprint: "sha256:48605876348a700322462d8b279473ff13d3d9426e8d36b872cae28ad4054f4e"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/presentation/menu-management/components/menu-overview-content.tsx
timestamp: 2026-10-25T02-59-15Z
slug: ment-components-menu-overview-content-tsx-2e271843
closed: true
---
# Critique: Productos → Menú tab
Method: dual-agent (A: design review · B: detector). Evidence: 10 emulator screenshots, source, detector. Dark theme not captured (in-app theme store).

## Design Health Score — 21/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Active filter = tile wash only; no count; rails vanish silently |
| 2 | Match System / Real World | 3 | Good copy; "-7 en stock" |
| 3 | User Control and Freedom | 2 | No clear-filter; Back doesn't clear; re-tap chip opens edit form |
| 4 | Consistency and Standards | 2 | Card 16px radius vs 6px; inert "Productos" tile; "Productos" ×4 |
| 5 | Error Prevention | 2 | "Nuevo producto" during filter prefills hidden category; chip double-tap |
| 6 | Recognition Rather Than Recall | 2 | No counts on category chips; results lack category context |
| 7 | Flexibility and Efficiency | 1 | Restock = 4 taps + modal; no long-press/sort |
| 8 | Aesthetic and Minimalist Design | 2 | Products start ~43% down; ~2.5 cards visible; "Sin control" noise |
| 9 | Error Recovery | 2 | Generic load error; no-results lacks query/clear |
| 10 | Help and Documentation | 3 | Stock-mode sheet explains consequences |

## Design Specificity
Stock line (product-stock-line.tsx:24-49) is the only product-specific element; frame is generic admin. Detector: 0 findings (verified it scans .tsx). Manual scan: inventory-content.tsx:285 font-semibold (no-op on custom font); menu-overview-content.tsx:382 clear IconButton no accessibilityLabel; :530 price via toFixed not formatCurrency; :417 gap-2 on horizontal ScrollView no-op.

## Priority Issues
1. [P1] Stock visible but not actionable from list — 4-tap restock. Fix: trailing Reponer → AdjustStockModal; multi-variant sheet; long-press ActionsBottomSheet. (/impeccable shape)
2. [P1] Untrustworthy numbers — product-stock-line.tsx:25 unclamped (-7); menu-overview-content.tsx:131 counts partial-out (outCount>0) as Agotado. Fix: clamp + "vendidos sin stock"; only fully-out in Agotados, partial separate. (/impeccable harden)
3. [P1] Chrome eats the screen — title/tabs/search/tiles/rails/labels; p-6 cards in narrow column. Fix: search to header icon, compact count chips, drop Productos tile + column labels, dense 6px rows. (/impeccable layout)
4. [P2] Filter mode silent — rails vanish, no count/exit, Back doesn't clear, Nuevo producto stays. Fix: "Agotados · N [✕ Quitar]" row, category on rows, hide create, Back clears. (/impeccable clarify)
5. [P2] Hidden chip edit + empty categories first — :187-220 re-tap edits; first category auto-selected even if empty; search copy for empty category. Fix: long-press edit, counts on chips, first non-empty, "Esta categoría aún no tiene productos" + Agregar aquí. (/impeccable clarify)

## Persona Red Flags
- Owner quick check: glance works; partial-out inflates Agotados; no in-place restock; untracked dishes can't be marked out; no sync freshness.
- Casey: search/tiles at top; chip double-tap → edit; Back doesn't exit filter.
- Alex: 4-tap restock; no urgency sort; no bulk enable tracking; search ignores category names.
- Sam: inactive = 50% opacity only (:510); Card no combined label; unlabeled clear button; 13px icon; fixed header at large font scale.

## Minor Observations
" - " vs " · " separators; "..." placeholder; tiles count whole menu during search; stock-mode-sheet.tsx:168 orange-700 vs 800.

## Questions to Consider
1. Default to attention list (Agotados + Bajo), browsing secondary?
2. Counting units vs marking a dish out ("86 it")?
3. Keep two chip rails, or reuse ordering menu's scroll-synced grouped list?
