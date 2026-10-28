---
target: app/(order)/[id]/edit-order-detail
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(order)/[id]/edit-order-detail/index.tsx"
target_fingerprint: "sha256:ff509af1433e5287c240f58f6ef89f5769ed4f180746a1ec649dd5f1b4a8609e"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(order)/[id]/edit-order-detail/index.tsx
timestamp: 2026-10-28T13-09-27Z
slug: app-order-id-edit-order-detail-index-tsx
closed: true
---
# Critique: edit-order-detail
Method: dual-agent (design review + detector). Score 17/40 (Poor).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | Save closes with no confirmation; unlabeled $; "/ qty" doesn't update |
| 2 | Real world | 2 | "Cambiar" unclear; pencil = price; info = activity; 3 status signals |
| 3 | Control & freedom | 1 | Back discards edits; note can't be edited; status resets delivered |
| 4 | Consistency | 2 | Blocked states OK; drifted from new-order product sheet |
| 5 | Error prevention | 1 | delivered > qty; status/delivered disagree; no stock limit; Save always on |
| 6 | Recognition | 2 | variant glued to title; custom price hidden |
| 7 | Efficiency | 2 | type picker sheet for 2 options; slider drag; no typed qty |
| 8 | Minimalism | 2 | empty top third; status noise |
| 9 | Error recovery | 1 | Alert.alert("Error", resp.msg) untranslated, raw server text |
| 10 | Help | 2 | blocked info sheets good; quantity minimum unexplained |

Detector: 0 findings across the screen + 4 sheets (scanner confirmed to read tw literals). No overlay (native).

## Priority issues
- [P0] Existing note can't be edited: TextInput pointerEvents="none" (index.tsx:302-313) + add-note chip hidden (:391-398). Fix: tappable row that opens noteSheetRef, like the product sheet. -> harden
- [P1] Delivered/quantity/status contradictions: delivered max = original quantity (:76-81, :328); stale "/ qty" (:322); onSelectStatus uses original quantity / resets to 0 (:245); slider gated on original quantity (:315); useCounter `value !== max` overshoots. Fix: base on edited quantity (counter), lower delivered with quantity, `<` check, show the reset in the sheet. -> harden
- [P1] Back discards edits silently; Save always enabled; silent router.back (:229-232); possible ticket print unannounced. Fix: dirty tracking + "Discard changes?" (beforeRemove like tables/reorder), disable Save while clean, priced CTA, success snackbar. -> harden
- [P1] Edits in the header, out of thumb reach: Cambiar ~41dp < 48; pencil = price; info = activity (:136-172); flex-1 spacer (:254). Fix: remove spacer, variant + price chips in the body, history icon only, variant as muted subtitle. -> layout
- [P2] Tags/status as Labels: ~28dp/40dp, no toggle a11y role; filter chip used as picker; type sheet for a 2-way choice. Fix: Chip selected, 48dp status target, inline toggle. -> adapt

## Personas
Waiter mid-rush: fix-note impossible; +2 has no total/confirm/ticket warning; 3 status signals. Casey: top-corner actions, fiddly slider, Back loses all. Sam: small targets, no toggle roles, unlabeled $, no disabled ± state. Riley: delivered>qty, invalid custom price, variant overwrites custom price (:202), no stock cap, long-name overlap (:283).

## Minor
Price sheet: no currency prefix/original price, "Listo" ambiguous; no ScrollView; dead-end empty state; outlined icon-button ink border vs hairline; variant card colors differ; hard-coded activity date format; qtyPaid ignored in quantity minimum.

## Questions
Merge with the product sheet as an edit mode? Derive status from delivered count? Why a draft at all when cart info saves live?
