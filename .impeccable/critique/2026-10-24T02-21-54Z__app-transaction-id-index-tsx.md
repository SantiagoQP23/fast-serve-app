---
target: app/transaction/[id]/
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/transaction/[id]/index.tsx"
target_fingerprint: "sha256:d5d36134b9b27d945013d7f24077a3cbc9951951d8f6ab04947f9f4f30961ade"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/transaction/[id]/index.tsx
timestamp: 2026-10-24T02-21-54Z
slug: app-transaction-id-index-tsx
---
# Critique: transaction detail (app/transaction/[id] → presentation/transactions/components/transaction-detail-view.tsx)

Method: dual-agent (A: design review · B: detector)

## Design Health Score — 16/40 (Poor)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No success feedback for upload/approve/account change; reject silent |
| 2 | Match System / Real World | 2 | "Aprobar Comprobante" approves the transaction; bankReference/senderName hidden |
| 3 | User Control and Freedom | 2 | Account picker commits instantly; approve irreversible, no undo |
| 4 | Consistency and Standards | 1 | Hand-rolled badges vs Label, DetailRow vs InfoRow, pencil button, floating bar, Alert + DialogModal mix; status colors differ from list card |
| 5 | Error Prevention | 1 | Approve with zero proofs; confirm lacks amount/account; isEditable ignored |
| 6 | Recognition Rather Than Recall | 2 | Amount vs proof compared from memory; viewer hides amount |
| 7 | Flexibility and Efficiency | 2 | Pull-to-refresh + tablet pane; no approve-in-viewer / next pending |
| 8 | Aesthetic and Minimalist | 2 | Decorative row icons, redundant pending chip, three tinted-box styles |
| 9 | Error Recovery | 1 | Reject impossible; load error = Cargando forever; camera-only permission copy |
| 10 | Help and Documentation | 1 | No guidance for PENDING_PROOF / rejected re-upload |

## Design Specificity
Generic fintech receipt. No restaurant context (transaction.bill unused), transfer verification fields (bankReference, senderName) unused, card/cash fields unused. Generation behind bill-detail-view.tsx. Detector: 0 findings in 4 files (blind to twrnc in RN); manual grep found tw font-semibold/bold (TDV:282,362,565), hard-coded black/white (454,561,565), raw yellow/red/green shades (366–429, 636–704).

## Priority Issues
- [P0] Reject cannot complete — showRejectInput set (TDV:183) never read, no input; rejectReason never set. Fix: reason sheet with chips + free text, toast, delete legacy bottom sheet. → harden
- [P1] Approve has no verification basis — generic confirm, approve with 0 proofs, no reference/sender, cover-cropped thumbnail. Fix: amount+account in confirm, explicit no-proof override, InfoRows, large contain proof, actions in viewer. → clarify, layout
- [P1] Missing states — isError ignored (TDV:245), no toasts, no onError on updateTransaction, proofs not refetched after approve, empty account picker. → harden
- [P2] Design-system drift — Label/InfoRow/field-edit-sheet/6px radii/typography.bold/ink border/docked bar with safe-area; Reject not filled red side-by-side. → polish, distill
- [P2] Accessibility — 32dp unlabeled remove button (TDV:452), unlabeled viewer close (568), proof Pressable (388), account IconButton (319), gray-400 contrast, ungrouped rows. → audit

## Persona Red Flags
Cashier mid-rush: scroll to proof, viewer hides amount, no reference, confirm lacks amount, stale Pendiente, cannot reject, no next pending.
Casey: equal-width Approve/Reject with filled red; pencil mid-card; 32dp ✕; upload tiles mid-scroll.
Sam: 4 unlabeled controls; color-only status on photo; inverted label/value; low-contrast dates.

## Minor Observations
Proof date no time (TDV:404); raw name vs getUserDisplayName (408); reviewedBy unused; empty header, no "Ver cuenta"; console.log (157); empty fragment (341); icon color string hack (676); redundant pending chip; pb-24 clearance.

## Questions
Verification on the proof itself? Approval on the bill instead? Require proof or make no-proof approval an explicit, reasoned override?
