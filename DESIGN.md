---
name: Teikio
description: Fast, simple restaurant ordering, built for the floor.
colors:
  primary: "#38608F"
  on-primary: "#FFFFFF"
  primary-container: "#D2E4FF"
  on-primary-container: "#1C4975"
  secondary: "#D7E3F8"
  on-secondary: "#3C4858"
  surface: "#ECEEF4"
  surface-high: "#E7E8EE"
  surface-container-low: "#F2F3FA"
  on-surface-variant: "#43474E"
  background: "#F8F9FF"
  text: "#191C20"
  icon: "#64748B"
  border: "#C3C6CF"
  outline-variant: "#C3C6CF"
  divider: "#F1F5F9"
  success: "#22C55E"
  warning: "#F97316"
  error: "#EF4444"
  info: "#3B82F6"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "36px"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: "28px"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  md: "6px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.3xl}"
    padding: "16px 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.3xl}"
    padding: "16px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.3xl}"
    padding: "24px"
  chip-selected:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
  chip-unselected:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
  text-input:
    backgroundColor: "{colors.surface-high}"
    rounded: "{rounded.3xl}"
    padding: "4px 12px"
---

# Design System: Teikio

## Overview

**Creative North Star: "The Steady Hand"**

Teikio is used tableside, mid-service, often one-handed, by someone who cannot afford to fumble the screen. The system reads as calm and efficient: steel-blue surfaces, soft 24px-rounded cards and controls, and a single medium-weight sans carrying every size from page titles down to status pills. Nothing decorative competes with the task — no gradients, no display face, no ornamental icons — because the interface's job is to disappear into the order, the table, the ticket in front of the user.

The Material-shaped color roles (`primary` / `onPrimary` / `primaryContainer` / `secondary` / `surface` / `onSurfaceVariant`) already speak Android's language even though the components themselves are hand-built rather than native Material widgets — a deliberate middle ground the system should keep leaning into as it moves toward fuller Android conformance, rather than abandoning for something more decorative.

**Key Characteristics:**
- One typeface (Plus Jakarta Sans), one accent hue, no display/body pairing.
- A single dominant radius (24px) unifies cards, buttons, inputs, and pickers; status `Label` pills and a couple of floating elements (FAB, dialogs) break from it — chips now sit at the system's small 6px radius instead of the pill shape they used to have.
- Outline-weight Ionicons throughout — no filled icon set, no mixed families.
- Two-tier elevation: content surfaces sit nearly flat (most carry no shadow at all), overlays lift with real shadow.

## Colors

A cool, restrained steel-blue palette on a near-white canvas — one accent color carries every interactive and selected state; everything else is neutral.

### Primary
- **Steel Harbor Blue** (`#38608F`): the app's only accent. Primary buttons, the app icon accent, active tab/nav indicators, links, an assist-chip's icon tint, and the price/primary-value emphasis on detail screens.
- **On Steel Harbor** (`#FFFFFF`): text/icons on top of Steel Harbor Blue fills.
- **Steel Harbor Container** (`#D2E4FF` / on: `#1C4975`): the pale containment tone for primary-tinted surfaces (defined in the palette; use where a primary-colored container, not a primary-colored fill, is needed — e.g. a `Label`'s `primary` color).

### Secondary
- **Pale Sky Blue** (`#D7E3F8`, text `#3C4858`): the selected/active fill for chips and segmented choices. This is what "selected" looks like everywhere in the app — never the primary color itself.

### Neutral
- **Frost White** (`#F8F9FF`): app canvas / screen background.
- **Cloud Surface** (`#ECEEF4`): cards, list rows, and input fields sit on this, one step darker than the canvas.
- **Cloud Surface High** (`#E7E8EE`): a slightly higher-contrast surface variant (currently underused; reserve for a surface that needs to read as "raised" relative to Cloud Surface).
- **Ink** (`#191C20`): primary text.
- **Slate Icon** (`#64748B`): default icon tint on neutral surfaces.
- **Hairline Border** (`#C3C6CF`): default borders and outlines — including the bordered (`outline`) `Card` variant, which is now the more common treatment for list-row cards (orders, bills, inventory items) than the solid-fill default.
- **Faint Divider** (`#F1F5F9`): the lightest separator, for hairlines inside a card/list rather than around it.

### Semantic
- **Success** (`#22C55E`), **Warning** (`#F97316`), **Error** (`#EF4444`), **Info** (`#3B82F6`): status labels and states (active/inactive, visible/hidden, stock, form errors). These come from the standard Tailwind palette rather than the primary token set — keep them as the semantic layer; don't recruit Steel Harbor Blue for status meaning.

### Named Rules
**The One Accent Rule.** Steel Harbor Blue is the only brand color in the system. Selection state is Pale Sky Blue, not a tint of the primary. Status is the semantic four, never the primary. If a screen needs a second "brand" color, that's a decision for `new-work`, not a local choice.

**Dark mode is incomplete.** `Colors.dark` currently defines only `primary` / `secondary` / `tertiary` / `text` / `background` / `tint` / `icon` — none of the surface, container, or on-color roles the light palette has. Treat dark mode as a real gap to close deliberately, not a place to invent values ad hoc per screen.

## Typography

**Body & Display Font:** Plus Jakarta Sans (regular/medium/semibold/bold), with system-ui/sans-serif fallback. One family for everything — no serif, no monospace, no separate display face.

**Character:** A single well-tuned grotesque carries page titles down to status pills. Body text defaults to the **medium** weight rather than regular — a deliberate legibility choice for a screen glanced at quickly, not read closely.

### Hierarchy
- **Display / h1** (semibold, 32px/40px): the one or two screen titles that need this weight (e.g. the main menu title).
- **Headline / h2** (regular, 28px/36px): empty-state and rare top-level headings — the one place in the scale where a larger size pairs with a *lighter* weight rather than a heavier one; worth a deliberate look before reusing elsewhere.
- **Title / h3** (medium, 22px/28px): screen/section headers, typically paired with a back button.
- **Subtitle / h4** (medium, 18px/24px): card headings, list item primary text (product/category/section names).
- **Body / body1** (medium, 16px/24px): the default text style — form values, primary row text.
- **Body secondary / body2** (regular, 14px/20px): descriptions, secondary row text, form field values that don't need emphasis.
- **Label / small** (medium, 12px/16px, gray): field labels, metadata, counts — always rendered in the neutral gray-500, never full-strength ink.
- **Caption** (medium, 14px/16px, uppercase, +0.5 tracking): rare, for an explicit eyebrow-style tag where the product calls for it.

### Named Rules
**The Medium-Body Rule.** Default body text is medium weight (500), not regular. Only secondary/supporting text (`body2`) and the h2 headline drop to regular. Don't default new body copy to regular weight — it will read as lighter than everything around it.

## Layout

Single-column, edge-padded screens (`px-4`, i.e. 16px side gutters) topped by either a native stack header or a custom title row with a leading back button and a trailing overflow (`ellipsis-vertical`) button. Content stacks vertically with consistent `gap-4` (16px) rhythm between sections; related fields inside a card use `gap-4` internally as well, so grouping comes from the card boundary, not from tighter internal spacing.

List + detail patterns favor one of two shapes: a flat scrollable list of `Card` rows — typically the bordered `outline` variant rather than a solid fill, so stacked rows don't compete visually — (swipeable for edit/delete on management screens), or a filter rail (horizontal chips for a top-level category, a wrapped chip column for a sub-category) beside a scrollable result list — used on both the customer-facing menu and the staff menu-management screen. Primary actions on a list screen are a single bottom-right `Fab`; primary actions on a detail/form screen are a header-trailing `Button`, never both at once on the same screen.

Bottom sheets (`ThemedBottomSheetModal`) are the standard surface for "more options" on a selected item and for pickers — including the newer wheel-style pickers (see Components) — for a single numeric value; full-screen `Modal` is reserved for a small, confirmation-only `DialogModal`.

## Elevation & Depth

Two tiers, correlated to whether an element sits in the content flow or floats above it. Resting surfaces carry no shadow at all, or at most a near-invisible boundary shadow — depth there comes from a fill or hairline border, not a lift. Floating/overlay elements (the FAB, dialogs, the options popover) carry a real, visible shadow with offset and blur, so the "this is above everything else" read is unambiguous.

### Shadow Vocabulary
- **Resting** (`shadow-xs`): `GroupedList` rows. A near-invisible boundary shadow, not a lift. `Card`'s default and `outline` variants carry **no shadow at all** — despite earlier guidance here, `Card` was never actually wired to `shadow-xs`; its depth comes from the Cloud Surface fill or the hairline border instead.
- **Floating** (`shadow-lg`): `Fab`, `DialogModal`. A pronounced elevation shadow for elements that sit above the page.
- **Popover** (`offset 0/4px, opacity 0.12, radius 12px, Android elevation 8`): the one place the system defines an exact, hand-tuned shadow rather than reaching for a preset — used for the anchored options popover.

### Named Rules
**The Two-Tier Rule.** A surface is either resting (no shadow, or the near-flat `shadow-xs` on a `GroupedList` row) or floating (pronounced, `shadow-lg` or the tuned popover shadow). Nothing sits in between — don't invent an intermediate shadow weight for a "somewhat important" card. (`Card` does carry an `elevated` variant using `shadow-sm` — a weight between the two tiers — but it has no call sites anywhere in the app today. Treat it as a latent exception to resolve deliberately, not a precedent for reaching for more in-between weights.)

## Shapes

One dominant radius drives the system: **24px** (`rounded-3xl`) on every primary surface — cards, primary/outline buttons, the icon button, text inputs, and the select trigger. Two smaller shapes exist for specific, limited roles: **16px** (`rounded-2xl`) for the two floating elements that don't use the 24px radius (the FAB and the confirmation dialog), and **6px** (`rounded-md`) for interior/secondary chrome — the interior seams of a `GroupedList` (the non-edge rows of a visually-continuous stacked list, whose first and last rows still take the full 24px on their outer corners) and, every `Chip` variant (`filter` / `assist` / `input` / `suggestion`). Fully circular **pill** shapes (`rounded-full`) are now reserved for status chrome only: the `Label` component and the vertical icon+label button layout — never for a content container, and no longer for chips. One legacy outlier survives outside this system: the anchored options `Popover` card (`rounded-xl`, 12px) predates the current shape language; it's being phased out in favor of the bottom-sheet pattern (see Components → Bottom Sheets & Popovers) and isn't a radius to reach for elsewhere.

### Named Rules
**The 24px Rule.** Any new primary surface — a card, a button, an input, a picker trigger — takes the 24px radius by default. Reach for 16px only for a floating element that isn't already covered (FAB/dialog), 6px for interior/secondary chrome (a `GroupedList` interior row, any chip), and a pill only for a status `Label` or the vertical icon+label button layout — never for a content container, and not for a chip.

## Components

### Buttons
- **Shape:** 24px radius (`rounded-3xl`) in the default horizontal layout; fully circular in the vertical icon+label layout.
- **Sizes:** five steps, `extra-small` (`px-3 py-[6px]`, 12px/6px) through `extra-large` (`px-16 py-12`, 64px/48px); `medium` — `px-6 py-4` (24px/16px) — is the default.
- **Primary:** Steel Harbor Blue fill, white text/icon.
- **Outline:** transparent fill, `border` hairline (`#C3C6CF`), text/icon in on-surface-variant gray.
- **Secondary / Text / Surface / Destructive:** secondary uses the Pale Sky Blue fill with its on-color text; text is a bare label in Steel Harbor Blue with no fill or border; surface is a neutral `Cloud Surface` fill for a lower-emphasis action; destructive is a soft `red-100` fill with `red-800` text (icon a shade darker, `red-900`) — never a hard red fill.
- **Loading:** the label is replaced by a spinner in the button's foreground color; the button keeps its size (no layout shift).

### Chips
- **Shape:** `rounded-md` (6px) — chips moved off the pill shape onto the system's small/interior radius; see Shapes. (`px-4 py-[6px]`, 16px/6px.)
- **Variants:** `filter` (default — toggle selection, e.g. category/status tabs), `assist` (a one-off action; never shows a filled/selected state), `input` (user-entered data — tags, attachments — with a trailing remove `×`), `suggestion` (label-only tap-to-choose).
- **Selected** (`filter` only): Pale Sky Blue fill, on-secondary text and icon; auto-shows a leading checkmark when nothing else occupies the leading slot.
- **Unselected:** transparent fill, `border-light-border` hairline, on-surface-variant text — not full-strength ink.
- **Input variant:** `surface-container-low` fill plus the same hairline border even when not "selected," since it represents entered data rather than a filterable option.
- **Assist variant:** never fills; when it has an icon, that icon is tinted Steel Harbor Blue rather than the default neutral gray — the one place a chip icon carries the primary color.

### Cards / Containers
- **Corner Style:** 24px (`rounded-3xl`) on every variant — see Shapes.
- **Variants:** `default` (solid Cloud Surface fill, no border) — grouped settings rows, form containers; `outline` (transparent fill, hairline border) — the standard treatment for stacked list-row cards (orders, bills, inventory items), so a long list doesn't read as a stack of heavy filled blocks; `elevated` (transparent fill, `shadow-sm`) exists in the component but has no call sites in the app today.
- **Shadow Strategy:** none, on both `default` and `outline` — see Elevation & Depth. Depth comes from the fill (`default`) or the border (`outline`), not a shadow.
- **Internal Padding:** 24px (`p-6`) on all sides, regardless of variant.
- **Inactive state:** an inactive record (product/category/section) renders its whole card at 50% opacity rather than a separate "inactive" visual treatment — the opacity drop *is* the inactive state.

### Inputs / Fields
- **Variants:** `filled` (default) — Cloud Surface High fill, 24px radius, **no border at any state**; `outlined` — transparent fill, a 1px hairline border that becomes the state color around the whole field.
- **Label:** floating — centered in the field like a placeholder when empty and unfocused, animates to a small caption pinned above the text on focus or once filled. Gray at rest/filled, Steel Harbor Blue while focused, red on error. Any native `placeholder` text is shown only while focused and empty, as a format hint under the now-floated label — it never competes with the label for the same space.
- **Active:** on `outlined`, the border becomes Steel Harbor Blue (`primary`) while focused; `filled` has no border to color, so focus shows only through the label.
- **Error:** the label and the inline error message always turn red; the field's own border turns red too, but only on `outlined` — a `filled` field conveys an error through the label and message alone. An inline `small` red message renders below the field either way.
- **Disabled:** 50% opacity on the whole field, same treatment whether empty or filled.

### Floating Actions & Dialogs
- **Fab:** 16px radius (`rounded-2xl`), Steel Harbor Blue fill by default, `shadow-lg`. Icon-only at rest (`w-16 h-16`); an optional label expands/collapses the pill width with a short width+opacity animation rather than popping in or out.
- **DialogModal:** 16px radius, white fill, `shadow-lg`, over a 50%-black scrim. `h3`/medium title, `body1`/regular message, a right-aligned Cancel/Confirm `Button` pair at `small` size. Reserved for short yes/no confirmations — see Do's and Don'ts.

### Labels (status)
- **Shape:** pill (`rounded-full`), two sizes (`medium` / `small`).
- **Soft** (default): a 10%-opacity tint of the status color, full-strength status-color text, no border.
- **Solid:** a pastel 100-level fill (e.g. `emerald-100` / `emerald-800`) with a leading status dot — used when the status needs to read at a glance without relying on text color alone.
- **Colors:** `success` / `warning` / `error` / `info` (the same semantic four from Colors) plus `default` (neutral gray), `outline` (hairline border, transparent fill), and `primary` (Steel Harbor Container fill) — two structural variants that aren't status at all.

### Navigation
- Screens use either the native stack header (title + system back chevron) or, on screens needing a trailing overflow action, a custom header row: leading back-chevron `Pressable` + `h3` title + trailing `ellipsis-vertical` `IconButton`. Bottom-of-list actions are a single bottom-right `Fab`, never a bottom tab bar for in-flow actions (the app's tab bar, where present, is reserved for top-level sections).

### Bottom Sheets & Popovers (signature pattern)
"More options" on a selected item (edit / activate-deactivate / delete) is consistently a bottom sheet with a title and a plain icon+label list (`ActionsBottomSheet`, optionally grouped into titled sections separated by a hairline) — or, on a couple of older screens, an anchored `Popover` with the same three actions. Both end with the same triad in the same order: **Edit → Activate/Deactivate → Delete**, delete always last and always red. New "more options" surfaces should follow the bottom-sheet form (the more recent of the two patterns), not add a third variant.

### Named Rules
**The Always-Enabled Rule.** A blockable action (e.g. replacing an item that's already been delivered, editing a variant once some of it has shipped) stays visually enabled and tappable everywhere it appears. The specific reason it can't proceed right now surfaces inline, the moment its sheet or card opens — never as a disabled/grayed-out state and never explained via an `Alert` fired on tap. Confirmed independently across two flows (order-detail item replacement, variant editing); treat it as the standard for any new blockable action, not a one-off.

### Wheel Picker (signature component)
A scrollable, haptic, iOS-style value picker (`WheelColumn` primitive) for fast, tactile single-value selection without typing: hours+minutes (`TimeWheelPicker`, used for order prep time) and hour-only (`HourWheelPicker`, used for the low-stock email hour). Each column is a snapping vertical list over a fixed 5-row window, with a Pale Sky Blue highlight band fixed at the center row; items fade and scale down with distance from center, and a light haptic tick fires on every settle. It's presented inside a bottom sheet with its own Done button rather than committing on every scroll tick — the value only saves once the user confirms.

## Do's and Don'ts

### Do:
- **Do** use 24px radius (`rounded-3xl`) as the default for any new card, button, input, or picker trigger.
- **Do** use Pale Sky Blue (`#D7E3F8`) for selected/active chip and filter state — never a tint of the primary blue.
- **Do** use the 6px chip radius (`rounded-md`) for any new chip — the pill shape belongs to status `Label`s now, not chips.
- **Do** render an inactive record as its card at 50% opacity, not a separate badge-only treatment.
- **Do** put "more options" (edit/activate/delete) behind a single bottom sheet or popover with Edit → Activate/Deactivate → Delete in that order, delete in red.
- **Do** keep a blockable action enabled and show its specific reason inline when the relevant sheet/card opens, rather than disabling it or explaining the block through an `Alert`.
- **Do** use outline-weight Ionicons exclusively, sized 18–28px depending on context.
- **Do** keep body text at medium weight (500); drop to regular only for explicitly secondary text (and the h2 headline).

### Don't:
- **Don't** introduce a second accent color. Steel Harbor Blue is the only brand hue; status uses the fixed semantic four (green/orange/red/blue).
- **Don't** invent an intermediate shadow weight. A surface is resting (no shadow, or `shadow-xs` on a `GroupedList` row) or floating (`shadow-lg`/the tuned popover shadow) — nothing in between.
- **Don't** default new body copy to regular weight; medium is the system default.
- **Don't** reach for a full-screen `Modal` for anything beyond a short yes/no confirmation — that's what `DialogModal` is for; everything else (options, pickers) is a bottom sheet.
- **Don't** invent dark-mode color values ad hoc per screen — the dark palette is a known, incomplete gap (see Colors), not a green light to freelance.
