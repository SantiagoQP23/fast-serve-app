---
target: app/(profile)/menu/modifier-groups
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/menu/modifier-groups"
timestamp: 2026-11-09T14-32-22Z
slug: app-profile-menu-modifier-groups
---
# Critique: app/(profile)/menu/modifier-groups/ (run 2)

Method: dual-agent (A: design review sub-agent, with emulator screenshots · B: detector sub-agent)

## Design Health Score: 25/40 (Acceptable; was 20/40)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | The list summary "Varios · Obligatorio" leaves out the counts (index:52-63) |
| 2 | Match System / Real World | 3 | "Cantidad", "Rango" and "Precio +" sound like database fields |
| 3 | User Control and Freedom | 3 | Swiping the option sheet down discards its edits without asking |
| 4 | Consistency and Standards | 2 | The form uses an h3 header, not DetailHeader, and doesn't use the Section* components; Delete is ink text; ButtonGroup uses circle-dot/square icons |
| 5 | Error Prevention | 2 | No check of min against available options; Varios with max 1 flips to Elige 1; the group and customization screens can overwrite each other |
| 6 | Recognition Rather Than Recall | 3 | No sentence or preview shows what the waiter will be asked |
| 7 | Flexibility and Efficiency | 2 | No duplicate, no inline toggle for availability, no "add another" |
| 8 | Aesthetic and Minimalist Design | 3 | Clean overall; the name appears twice and the same icon repeats on every card |
| 9 | Error Recovery | 2 | One vague grey line sits above a disabled Save; it shows before anything is typed |
| 10 | Help and Documentation | 2 | Nothing explains exact vs range or what a required group does to ordering |

## Priority Issues
- [P1] A required minimum can exceed the available options, which blocks ordering. form:461-473 never compares minValue with the count of active options.
- [P1] The rule is never stated as a sentence, and the list hides the counts. describeLimits (group-limits-sheet:54) exists but neither screen uses it (form:589-662, index:52-63).
- [P1] The group form and the customization screen push each other, and the customization draft never re-syncs. A save there can undo an unlink made on the group screen (customization:320, 609-614; form:722-727).
- [P2] Validation feedback is vague, shows too early and sits away from its field. Unchanged since the last run (form:461-473, 770-774).
- [P2] The form breaks the conventions of the screens around it: header, section titles, Delete style, ButtonGroup icons, and an Active switch stranded at the bottom.

## Detector
0 findings with exit 0, confirmed with --no-config. The browser overlay doesn't apply to a native RN screen.

## Minor
- usedInCount comes from saved links, not the draft.
- Changing the default option unsets the old one without feedback.
- Role gating is only partial.
- Option rows don't show the insumo's stock.
- The ButtonGroup selection is barely visible.
- There's no currency prefix on the price.
- The empty list has no CTA.
- Small targets: Seleccionar todos (~32dp), Eliminar grupo and Quitar opción (~40dp).
- List cards have no button role.
- Inactive cards sit at 50% opacity.
