---
target: table bottom sheet in app/(profile)/tables/index.tsx
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/tables/index.tsx"
target_fingerprint: "sha256:da92cc0d02496c3a086e9864c79d7bc7024b9be071fe4c70efb2713d1277d646"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/tables/index.tsx
timestamp: 2026-10-22T04-05-03Z
slug: app-profile-tables-index-tsx
---
Method: dual-agent (A: design-review sub-agent · B: detector sub-agent). Evidence: source + live Android emulator (Light, es), sheet opened on "Mesa 1".

# Table actions sheet — critique (app/(profile)/tables/index.tsx:425-489)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Eye tap closes sheet instantly (:186); no success feedback; "Inactiva" never shown in words (Label commented out :441-451) |
| 2 | Match System / Real World | 2 | Eye = "remove table from floor"; "Mesa {{name}}" + placeholder "ej. Mesa terraza" → "Mesa Mesa terraza"; "1 sillas" |
| 3 | User Control and Freedom | 2 | Toggle is one tap, no undo |
| 4 | Consistency and Standards | 2 | Only management sheet with stacked text buttons + ink Delete; eye = state here, action on payment methods/product toolbar |
| 5 | Error Prevention | 2 | Deactivate has no open-order/offline guard (floor sheet has both) |
| 6 | Recognition Rather Than Recall | 2 | Eye is icon-only |
| 7 | Flexibility and Efficiency | 2 | Sheet closes after toggle; multi-select only moves zones |
| 8 | Aesthetic and Minimalist Design | 3 | Calm, on-brand; emphasis misplaced on the eye |
| 9 | Error Recovery | 2 | Generic failure toast after sheet is gone, no retry |
| 10 | Help and Documentation | 1 | Nothing explains inactive hides the table from waiters (tables-view.tsx:33) |
| **Total** | | **20/40** | **Acceptable** |

## Design Specificity Verdict
Generic: no zone, no occupied/open-order signal, no consequence of deactivating. Mid-migration since 53ad33d (stacked text buttons) while areas, printers, menu overview, production areas keep the Delete-destructive + Edit-surface row. Detector: 0 findings in index.tsx and 7 rendered components (also with config/ignores disabled); blind to RN inline style objects, runtime colors, a11y. No overlays (native).

## Priority Issues
- [P1] Eye toggle riskiest + least legible (:459-463, :180-187): unlabeled, no accessibilityLabel, closes with no feedback/undo/guard; eye semantics inconsistent app-wide. Fix: labeled Desactivar/Activar Button in stack (unused settings.deactivate/activate keys), Label "Inactiva" in meta row, body2 consequence line, inline block reason for open orders/offline, flip in place with loading. Cmd: clarify → harden.
- [P2] Delete lost destructive cue + 48dp (:476-485): ink text like Edit, size=small ~40dp, no separator; dialog "Confirmar", no name. Fix: red text Button tone (new variant), same size, last under border-t hairline; dialog with {{name}}, "Eliminar", secondaryLabel "Desactivar". Cmd: polish (+clarify).
- [P2] No primary action; leftovers (:425-489): centered bare text, misaligned icons, invisible pressed state, flex-1 on Edit (:470), h2 vs h3, px-4 vs px-8. Fix: mirror floor sheet (Edit outline / Desactivar text / Eliminar red); optional shared management sheet for 4 siblings. Cmd: layout.
- [P3] Copy/edge cases: "Mesa Mesa terraza"; chairsCount lacks _one; chairs ?? 0 → "0 sillas" (grid hides it, :235); no line limits; zone not shown. Cmd: harden.

## Persona Red Flags
- Casey: eye top-right next to title; mis-tap hides table, sheet vanishes, only evidence is a dimming tile.
- Sam: eye read as "botón"; inactive conveyed by opacity only (:218); Button lacks accessibilityRole; Delete ~40dp; title not a header.
- Alex: closing a terrace = one sheet per table; multi-select only moves zones.
- Owner between services: labeled "take it out" option is Eliminar; reversible one is an unlabeled eye; dialog never offers Desactivar.

## Minor Observations
- h2 overridden to medium (:430) vs DESIGN semibold headings (family-wide).
- Chairs wrapper flex-row with one child (:434-440).
- Commented-out Label (:441-451) and hint (:318-322).
- Orphaned delete DialogModal in tables/form/index.tsx:221-231.

## Questions to Consider
- Drop the sheet: tap opens edit form with Desactivar + red Eliminar at bottom?
- Do tables need "inactive" now that zones can be hidden? Use "Ocultar"?
- Should the eye mean only show/hide-on-screen app-wide?
- Hiding/deleting a table with open orders: block with reason, or allow and warn?
