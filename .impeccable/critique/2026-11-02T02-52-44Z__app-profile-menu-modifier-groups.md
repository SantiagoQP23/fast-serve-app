---
target: the modifier groups screens
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/menu/modifier-groups"
timestamp: 2026-11-02T02-52-44Z
slug: app-profile-menu-modifier-groups
closed: true
---
Method: dual-agent (A: design review · B: detector)

## Design Health Score: 20/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | Text-only loading; no unsaved/impact signal |
| 2 | Real world | 3 | "Precio +" lacks currency; qty lacks unit |
| 3 | Control & freedom | 1 | Back discards edits silently; option trash no undo |
| 4 | Consistency | 2 | Fab vs DetailHeader+pill; header trash vs bottom Delete |
| 5 | Error prevention | 2 | Nameless options with price/insumo dropped on save |
| 6 | Recognition | 2 | Empty Máximo = unlimited, hint only on focus |
| 7 | Efficiency | 2 | Arrow-only reorder; no duplicate/quick-add |
| 8 | Minimalist | 2 | 8 controls per option card |
| 9 | Error recovery | 2 | Generic error, no card pointer, shown before input |
| 10 | Help | 2 | Shared-group concept never explained |

## Specificity
Half-authored: domain copy, waiter-matching one/many icons, option-name search. Structure is generic CRUD; ignores sharing (impact buried in "Usado en") and never previews the waiter-facing result. Detector: 0 findings (web-CSS heuristics, RN target). No overlay (native).

## Priority Issues
- [P1] Silent edit loss: no beforeRemove guard; option trash instant, 4dp from arrow-down. Fix: discard guard (edit-order-detail pattern), undo snackbar, separate trash. /harden
- [P1] Targets <48dp: back Pressable 24dp; IconButton slop assumes p-3 but renders p-2 (~40dp at size 18, app-wide); ButtonGroup small ~36dp. /harden
- [P1] Overloaded option cards + buried impact: collapse to rows + edit sheet, reorder mode, impact line under title, Activo near Delete. /distill /layout
- [P2] Convention drift: Fab, header trash, font-semibold, no inactive opacity, duplicated insumo row. /polish
- [P2] Validation on mount, non-located errors, hidden "Sin límite", "0" default price, unitless qty, no waiter preview. /clarify

## Persona red flags
Jordan: sharing unexplained, required+min duplication, jargon, premature error. Sam: identical a11y labels, unnamed insumo row, no live error region, small targets. Casey: 24dp top-left back, trash in thumb arc. Owner: product-customization "Nuevo grupo" returns unlinked; no duplicate; can't link products from group.

## Minor
Error state shows "not found" w/o retry; no search-empty state; "0 productos" copy; partial canManage gating; truncated summary hides product count; "Disponible" vs "Agotado" ambiguity; unhandled mutateAsync rejections.

## Questions
Editor as the live waiter picker? Single home for option stock deduction? Flavor-list default with rules behind "Reglas"?
