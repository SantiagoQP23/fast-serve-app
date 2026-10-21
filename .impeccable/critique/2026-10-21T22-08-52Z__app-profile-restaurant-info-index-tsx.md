---
target: my @app/(profile)/restaurant/info/index.tsx
total_score: 18
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/restaurant/info/index.tsx"
target_fingerprint: "sha256:139c8fa010ee55f56c2f80d8826f973407cd7aa1eb3e1ebe3e13b0eaae4f31eb"
target_path: /Users/santiagoquirumbay/projects/restaurant-app/fast-serve-app/app/(profile)/restaurant/info/index.tsx
timestamp: 2026-10-21T22-08-52Z
slug: app-profile-restaurant-info-index-tsx
closed: true
---
⚠️ DEGRADED: single-context (Assessment A sub-agent stopped by user; design review completed inline after detector results arrived; detector was clean, so anchoring risk minimal)

Evidence: emulator-5554 capture of the live screen (light theme, es, font scale 1.0) + source read. Dark/Paper and 1.3 font scale not captured.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Every subscription status renders as the same gray pill; "Problema de pago" looks identical to "Activo" |
| 2 | Match System / Real World | 3 | Labels localized well ("RUC / Identificación"), but date shows 2/21/2030 (US order) in the Spanish UI |
| 3 | User Control and Freedom | 3 | Read-only, clear back, edit is separate |
| 4 | Consistency and Standards | 2 | Dates bypass app formatDate; raw grays instead of roles; one section has an eyebrow, the other doesn't |
| 5 | Error Prevention | n/a | Read-only screen, no inputs or destructive actions |
| 6 | Recognition Rather Than Recall | 3 | Everything visible; empty fields don't show how to fill them |
| 7 | Flexibility and Efficiency | 1 | Can't call, email, or copy the RUC |
| 8 | Aesthetic and Minimalist Design | 2 | Calm, but labels outshout values; orphaned centered button |
| 9 | Error Recovery | n/a | No error states on this screen |
| 10 | Help and Documentation | 2 | "Sin definir" gives no hint why a field matters or where to fix it |
| Total | | 18/32 | Acceptable (56%) |

## Design Specificity Verdict
LLM: category-interchangeable "organization details" key/value page; on-system (paper & ink, no cards/decoration) but the details that carry brand in Operate mode (hierarchy, status color, local date format) slip. Missed: reading as the restaurant's record card (identity, contact, fiscal, standing).
Detector: 0 findings on target and 6 shared components (verified working on twrnc via probe). Rules don't check palette steps vs roles, so it missed raw gray-600/400 (lines 33, 97) and the date issue. No false positives.
Overlay: n/a (native screen, no web route).

## What's Working
- Stays inside the system: plain rows, no cards, 48dp rows, one accent.
- Role gating correct and quiet: Edit only for isAdminLevelRole; subscription press + chevron only for Roles.OWNER.
- Empty values handled explicitly ("Sin definir"); market-fit labels.

## Priority Issues
1. [P1] Subscription status has no urgency. Label color="default" for every status (info/index.tsx:75; same on manage.tsx:192). GRACE_PERIOD counts as active in hasActiveSubscription (no paywall) and no other UI surfaces it, so this gray pill is the owner's only warning before lockout. Fix: shared status->color helper (ACTIVE success, TRIAL info, GRACE_PERIOD/ON_HOLD warning, PAUSED/EXPIRED/CANCELLED error); inline reason + action for problem states; status-specific period copy (Renews on / Access ends on / Expired on) instead of "Renews/expires on". Command: harden.
2. [P1] Label/value hierarchy inverted. InfoRow (info/index.tsx:23): label body 16 medium ink, value body2 14 regular gray-600. Right-aligned values across a wide gap; long address/email wrap ragged-right. Fix: stack small muted label over body ink value, left-aligned, matching the floating-label edit form. Command: layout.
3. [P2] Raw grays + US-order date. tw.color("gray-600"/"gray-400") (lines 33, 97); gray-400 placeholder ~2.5:1 (fails 4.5:1); toLocaleDateString() (84, 91) renders 2/21/2030 in Spanish while core/i18n/utils.ts:46 formatDate uses DD/MM/YYYY. Fix: text-on-surface values, text-gray-500 placeholder, default icon chevron, formatDate. Command: polish.
4. [P2] Uneven sectioning + orphaned last action. Subscription has an eyebrow (150), details don't; 5 ungrouped rows mixing contact and business. "Gestionar otro restaurante" centered text button (169) in a left-aligned column, account-level, ambiguous. Fix: Contacto / Negocio / Suscripción groups; switch action as left-aligned row with store icon + chevron; copy "Cambiar de restaurante" (needs user OK). Command: layout, then clarify.
5. [P2] Data is display-only. No call/mail/copy; values not selectable; empty rows dead ends for editors. Fix: selectable values, Linking for tel/mailto, empty rows -> "Agregar X" opening edit. Command: onboard.

## Persona Red Flags
- Sam: gray-400 "Sin definir" ~2.5:1; InfoRow = two separate focus stops; subscription Pressable has role but no accessibilityLabel, TalkBack reads concatenated text with US date.
- Jordan (new owner): 3-4 "Sin definir" rows with no why/how except small header Editar; "Gestionar otro restaurante" ambiguous.
- Owner checking standing mid-service: gray "Problema de pago" identical to "Activo"; no next step besides the chevron.

## Minor Observations
- Header title empty (_layout.tsx:63); h1 name repeats Manage's h1; DESIGN.md uses h3 for detail titles.
- Edit as header button vs DESIGN.md's FloatingToolbar-for-detail rule: header is better for one action; consider codifying.
- "Plan: Premium" can drop "Plan:" under the section eyebrow; missing plan reads "Plan: Sin definir".
- currentRestaurant null -> empty h1 + five "Sin definir" rows (misleading).
- Model has branchNumber (could feed "Sucursal 2 de La Isla") and an unused logo field.
- Gray gear bubble in the capture isn't rendered by this file (likely dev overlay).

## Questions to Consider
- Do owners come here to check details or standing? If standing, should Subscription lead?
- For editors, should "Not set" exist, or should each empty row be the invitation to fill it?
- Does "Manage other restaurant" belong here, or is the name on Manage the natural switcher?
