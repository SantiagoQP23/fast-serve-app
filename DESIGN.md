---
name: Teikio
description: Fast, simple restaurant ordering, built for the floor.
colors:
  primary: "#1C1B19"
  on-primary: "#FFFFFF"
  primary-container: "#E8E8E8"
  on-primary-container: "#1C1B19"
  secondary: "#8FAFC4"
  on-secondary: "#1C1B19"
  surface: "#F2F2F2"
  surface-high: "#ECECEC"
  surface-container-low: "#F7F7F7"
  on-surface-variant: "#4A4A4A"
  background: "#FFFFFF"
  text: "#1C1B19"
  icon: "#737373"
  border: "#DCDCDC"
  outline-variant: "#DCDCDC"
  divider: "#EEEEEE"
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

Teikio is used tableside, mid-service, often one-handed, by someone who cannot afford to fumble the screen. The system reads as calm and efficient: warm paper surfaces with ink-black accents, soft 24px-rounded cards and controls, and a single medium-weight sans carrying every size from page titles down to status pills. Nothing decorative competes with the task — no gradients, no display face, no ornamental icons — because the interface's job is to disappear into the order, the table, the ticket in front of the user.

The Material-shaped color roles (`primary` / `onPrimary` / `primaryContainer` / `secondary` / `surface` / `onSurfaceVariant`) already speak Android's language even though the components themselves are hand-built rather than native Material widgets — a deliberate middle ground the system should keep leaning into as it moves toward fuller Android conformance, rather than abandoning for something more decorative.

**Key Characteristics:**
- One typeface (Plus Jakarta Sans), one accent hue, no display/body pairing.
- A single dominant radius (24px) unifies cards, buttons, inputs, and pickers; status `Label` pills and a couple of floating elements (FAB, dialogs) break from it — chips now sit at the system's small 6px radius instead of the pill shape they used to have.
- Outline-weight Ionicons throughout — no filled icon set, no mixed families.
- Two-tier elevation: content surfaces sit nearly flat (most carry no shadow at all), overlays lift with real shadow.

## Colors

Paper and ink: a white page with neutral gray surfaces with ink-black as the one accent, and a pale ink-blue wash for "selected". Everything else is a warm neutral, so screens read like a printed menu or a notebook rather than a tech dashboard.

### Primary
- **Ink Black** (`#1C1B19`): the app's only accent. Primary buttons, the FAB, switches, active nav indicators, links, selection checkmarks/borders, refresh spinners, and the price/primary-value emphasis on detail screens. A warm black, never pure `#000`.
- **On Ink** (`#FFFFFF`): text/icons on top of Ink Black fills.
- **Ink Container** (`#E8E8E8` / on: `#1C1B19`): the pale containment tone for primary-tinted surfaces (e.g. a `Label`'s `primary` color).

### Secondary
- **Ink-Blue Wash** (`#8FAFC4`, text `#1C1B19`): the selected/active fill for chips, the active tab pill, segmented choices, button groups, selected order cards and the wheel-picker band. This is what "selected" looks like everywhere in the app — never the primary color itself.
- **Deep Ink Blue** (`#2C4566`, text `#FFFFFF`): `secondaryContainer`, the stronger selected fill used by the active `SegmentedControl` segment (text uses `on-secondary-container`).

### Neutral
- **Paper White** (`#FFFFFF`): app canvas / screen background.
- **Paper Surface** (`#F2F2F2`, neutral gray): cards, list rows, and input fields sit on this, one step darker than the canvas.
- **Paper Surface High** (`#ECECEC`): a slightly higher-contrast surface variant (reserve for a surface that needs to read as "raised" relative to Paper Surface).
- **Ink** (`#1C1B19`): primary text.
- **Graphite Icon** (`#737373`): default icon tint on neutral surfaces.
- **Hairline Border** (`#DCDCDC`): default borders and outlines — including the bordered (`outline`) `Card` variant, the most common treatment for list-row cards (orders, bills, inventory items).
- **Faint Divider** (`#EEEEEE`): the lightest separator, for hairlines inside a card/list rather than around it.
- Tailwind's `gray` scale is swapped for the `neutral` scale on Light (500 darkened to `#6B6B6B` so labels keep 4.5:1 on Paper Surface) (`stone` on Paper), so `text-gray-500` doesn't lean cool blue.

### Semantic
- **Success** (`#22C55E`), **Warning** (`#F97316`), **Error** (`#EF4444`), **Info** (`#3B82F6`): status labels and states (active/inactive, visible/hidden, stock, form errors). These come from the standard Tailwind palette rather than the primary token set — keep them as the semantic layer; don't recruit Ink Black or the ink-blue wash for status meaning.

### Named Rules
**The One Accent Rule.** Ink Black is the only brand color in the system. Selection state is the Ink-Blue Wash, not a tint of the primary. Status is the semantic four, never the primary. Accent-like UI (refresh spinners, selection checkmarks, focus borders) uses `primary`, never a hard-coded `blue-500`. If a screen needs a second "brand" color, that's a decision for `new-work`, not a local choice.

**Roles, not colors.** Every color comes from a role in `constants/theme.ts` (`Palette`), used as a prefix-free class (`bg-surface`, `text-on-surface-variant`, `bg-primary`, `text-on-primary`) or through `usePalette()` / `tw.color()` when a prop needs a raw value. Never hard-code a hex value or `white` for something that sits on a themed surface, and never compute a color in a module-level `StyleSheet.create`: it won't follow the theme.

### Themes
The user picks a theme per device in Settings → Appearance (`useThemeStore`). Values for every role live in `palettes`:
- **Light** (default): white page, neutral gray surfaces — the palette described above.
- **Paper**: aged cream notebook paper — warm off-white canvas (`#F4EFE6`), sand surfaces (`#EAE4D8`), warm ink text and accent (`#24211D`, text on it `#FBF8F2`), ink-blue wash for selected (`#8FAFC4`, ink text `#24211D`). Tailwind's `gray` scale is swapped for the warm `stone` scale.
- **Black** (labelled "Dark"/"Oscuro"): dark paper — warm charcoal canvas (`#141311`), surfaces `#1E1C19` / `#262420`, ivory text, and ivory ink as the accent (`#EDE8DF`, text on it `#141311`); selected is a deep ink-blue (`#1F2A38`, text `#DCE4EE`). Tailwind scales are remapped (`colorScaleOverrides`): `gray` becomes a warm charcoal ramp, pale shades (50–300) of the other scales become dark fills and dark text shades (700+) become light, so `bg-red-100 text-red-800` still reads as a soft label.

The One Accent Rule holds in every theme. Printed receipts and QR codes stay black on white.

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
- **Resting** (`shadow-xs`): `GroupedList` rows. A near-invisible boundary shadow, not a lift. `Card`'s default and `outline` variants carry **no shadow at all** — despite earlier guidance here, `Card` was never actually wired to `shadow-xs`; its depth comes from the Paper Surface fill or the hairline border instead.
- **Floating** (`shadow-lg`): `Fab`, `DialogModal`. A pronounced elevation shadow for elements that sit above the page.
- **Popover** (`offset 0/4px, opacity 0.12, radius 12px, Android elevation 8`): the one place the system defines an exact, hand-tuned shadow rather than reaching for a preset — used for the anchored options popover.

### Named Rules
**The Two-Tier Rule.** A surface is either resting (no shadow, or the near-flat `shadow-xs` on a `GroupedList` row) or floating (pronounced, `shadow-lg` or the tuned popover shadow). Nothing sits in between — don't invent an intermediate shadow weight for a "somewhat important" card. (`Card`'s `elevated` variant is the one sanctioned resting lift: an opaque Surface Container Low fill (`#F7F7F7`) with a hand-tuned Material level-1 shadow — offset 0/1px, opacity 0.12, radius 3px, Android elevation 2 — used for empty table cards on the home grid. The fill is mandatory: a transparent elevated surface renders no shadow or radius on Android. Don't reach for further in-between weights.)

## Shapes

One dominant radius drives the system: **24px** (`rounded-3xl`) on every primary surface — cards, primary/outline buttons, the icon button, text inputs, and the select trigger. Two smaller shapes exist for specific, limited roles: **16px** (`rounded-2xl`) for the two floating elements that don't use the 24px radius (the FAB and the confirmation dialog), and **6px** (`rounded-md`) for interior/secondary chrome — the interior seams of a `GroupedList` (the non-edge rows of a visually-continuous stacked list, whose first and last rows still take the full 24px on their outer corners) and, every `Chip` variant (`filter` / `assist` / `input` / `suggestion`). Fully circular **pill** shapes (`rounded-full`) are now reserved for status chrome only: the `Label` component and the vertical icon+label button layout — never for a content container, and no longer for chips. One legacy outlier survives outside this system: the anchored options `Popover` card (`rounded-xl`, 12px) predates the current shape language; it's being phased out in favor of the bottom-sheet pattern (see Components → Bottom Sheets & Popovers) and isn't a radius to reach for elsewhere.

### Named Rules
**The 24px Rule.** Any new primary surface — a card, a button, an input, a picker trigger — takes the 24px radius by default. Reach for 16px only for a floating element that isn't already covered (FAB/dialog), 6px for interior/secondary chrome (a `GroupedList` interior row, any chip), and a pill only for a status `Label` or the vertical icon+label button layout — never for a content container, and not for a chip.

## Components

### Buttons
- **Shape:** 24px radius (`rounded-3xl`) in the default horizontal layout; fully circular in the vertical icon+label layout.
- **Sizes:** five steps, `extra-small` (`px-3 py-[6px]`, 12px/6px) through `extra-large` (`px-16 py-12`, 64px/48px); `medium` — `px-6 py-4` (24px/16px) — is the default.
- **Primary:** Ink Black fill, white text/icon.
- **Outline:** transparent fill, `border` hairline (`#C3C6CF`), text/icon in on-surface-variant gray.
- **Secondary / Text / Surface / Destructive:** secondary uses the Ink-Blue Wash fill with its on-color text; text is a bare label in Ink Black with no fill or border; surface is a neutral `Paper Surface` fill for a lower-emphasis action; destructive is a soft `red-100` fill with `red-800` text (icon a shade darker, `red-900`) — never a hard red fill.
- **Loading:** the label is replaced by a spinner in the button's foreground color; the button keeps its size (no layout shift).

### Chips
- **Shape:** `rounded-md` (6px) — chips moved off the pill shape onto the system's small/interior radius; see Shapes. (`px-4 py-[6px]`, 16px/6px.)
- **Variants:** `filter` (default — toggle selection, e.g. category/status tabs), `assist` (a one-off action; never shows a filled/selected state), `input` (user-entered data — tags, attachments — with a trailing remove `×`), `suggestion` (label-only tap-to-choose).
- **Selected** (`filter` only): Ink-Blue Wash fill, on-secondary text and icon; auto-shows a leading checkmark when nothing else occupies the leading slot.
- **Unselected:** transparent fill, `border-light-border` hairline, on-surface-variant text — not full-strength ink.
- **Input variant:** `surface-container-low` fill plus the same hairline border even when not "selected," since it represents entered data rather than a filterable option.
- **Assist variant:** never fills; when it has an icon, that icon is tinted Ink Black rather than the default neutral gray — the one place a chip icon carries the primary color.

### Cards / Containers
- **Corner Style:** 24px (`rounded-3xl`) on every variant — see Shapes.
- **Variants:** `default` (solid Paper Surface fill, no border) — grouped settings rows, form containers; `outline` (transparent fill, hairline border) — the standard treatment for stacked list-row cards (orders, bills, inventory items), so a long list doesn't read as a stack of heavy filled blocks; `elevated` (transparent fill, `shadow-sm`) exists in the component but has no call sites in the app today.
- **Shadow Strategy:** none, on both `default` and `outline` — see Elevation & Depth. Depth comes from the fill (`default`) or the border (`outline`), not a shadow.
- **Internal Padding:** 24px (`p-6`) on all sides, regardless of variant.
- **Inactive state:** an inactive record (product/category/section) renders its whole card at 50% opacity rather than a separate "inactive" visual treatment — the opacity drop *is* the inactive state.

### Inputs / Fields
- **Variants:** `filled` (default) — Paper Surface High fill, 24px radius, **no border at any state**; `outlined` — transparent fill, a 1px hairline border that becomes the state color around the whole field.
- **Label:** floating — centered in the field like a placeholder when empty and unfocused, animates to a small caption pinned above the text on focus or once filled. Gray at rest/filled, Ink Black while focused, red on error. Any native `placeholder` text is shown only while focused and empty, as a format hint under the now-floated label — it never competes with the label for the same space.
- **Active:** on `outlined`, the border becomes Ink Black (`primary`) while focused; `filled` has no border to color, so focus shows only through the label.
- **Error:** the label and the inline error message always turn red; the field's own border turns red too, but only on `outlined` — a `filled` field conveys an error through the label and message alone. An inline `small` red message renders below the field either way.
- **Disabled:** 50% opacity on the whole field, same treatment whether empty or filled.

### Floating Actions & Dialogs
- **Fab:** 16px radius (`rounded-2xl`), Ink Black fill by default, `shadow-lg`. Icon-only at rest (`w-16 h-16`); an optional label expands/collapses the pill width with a short width+opacity animation rather than popping in or out.
- **DialogModal:** 16px radius, white fill, `shadow-lg`, over a 50%-black scrim. `h3`/medium title, `body1`/regular message, a right-aligned Cancel/Confirm `Button` pair at `small` size. Reserved for short yes/no confirmations — see Do's and Don'ts.

### Labels (status)
- **Shape:** pill (`rounded-full`), two sizes (`medium` / `small`).
- **Soft** (default): a 10%-opacity tint of the status color, full-strength status-color text, no border.
- **Solid:** a pastel 100-level fill (e.g. `emerald-100` / `emerald-800`) with a leading status dot — used when the status needs to read at a glance without relying on text color alone.
- **Colors:** `success` / `warning` / `error` / `info` (the same semantic four from Colors) plus `default` (neutral gray), `outline` (hairline border, transparent fill), and `primary` (Ink Container fill) — two structural variants that aren't status at all.

### Navigation
- Screens use either the native stack header (title + system back chevron) or, on screens needing a trailing overflow action, a custom header row: leading back-chevron `Pressable` + `h3` title + trailing `ellipsis-vertical` `IconButton`. Bottom-of-list actions are a single bottom-right `Fab`, never a bottom tab bar for in-flow actions (the app's tab bar, where present, is reserved for top-level sections).

### Bottom Sheets & Popovers (signature pattern)
"More options" on a selected item (edit / activate-deactivate / delete) is consistently a bottom sheet with a title and a plain icon+label list (`ActionsBottomSheet`, optionally grouped into titled sections separated by a hairline) — or, on a couple of older screens, an anchored `Popover` with the same three actions. Both end with the same triad in the same order: **Edit → Activate/Deactivate → Delete**, delete always last and always red. New "more options" surfaces should follow the bottom-sheet form (the more recent of the two patterns), not add a third variant.

### Named Rules
**The Always-Enabled Rule.** A blockable action (e.g. replacing an item that's already been delivered, editing a variant once some of it has shipped) stays visually enabled and tappable everywhere it appears. The specific reason it can't proceed right now surfaces inline, the moment its sheet or card opens — never as a disabled/grayed-out state and never explained via an `Alert` fired on tap. Confirmed independently across two flows (order-detail item replacement, variant editing); treat it as the standard for any new blockable action, not a one-off.

### Wheel Picker (signature component)
A scrollable, haptic, iOS-style value picker (`WheelColumn` primitive) for fast, tactile single-value selection without typing: hours+minutes (`TimeWheelPicker`, used for order prep time) and hour-only (`HourWheelPicker`, used for the low-stock email hour). Each column is a snapping vertical list over a fixed 5-row window, with a Ink-Blue Wash highlight band fixed at the center row; items fade and scale down with distance from center, and a light haptic tick fires on every settle. It's presented inside a bottom sheet with its own Done button rather than committing on every scroll tick — the value only saves once the user confirms.

## Do's and Don'ts

### Do:
- **Do** use 24px radius (`rounded-3xl`) as the default for any new card, button, input, or picker trigger.
- **Do** use the Ink-Blue Wash (`#8FAFC4`) for selected/active chip and filter state — never a tint of the primary.
- **Do** use the 6px chip radius (`rounded-md`) for any new chip — the pill shape belongs to status `Label`s now, not chips.
- **Do** render an inactive record as its card at 50% opacity, not a separate badge-only treatment.
- **Do** put "more options" (edit/activate/delete) behind a single bottom sheet or popover with Edit → Activate/Deactivate → Delete in that order, delete in red.
- **Do** keep a blockable action enabled and show its specific reason inline when the relevant sheet/card opens, rather than disabling it or explaining the block through an `Alert`.
- **Do** use outline-weight Ionicons exclusively, sized 18–28px depending on context.
- **Do** keep body text at medium weight (500); drop to regular only for explicitly secondary text (and the h2 headline).

### Don't:
- **Don't** introduce a second accent color. Ink Black is the only brand hue; status uses the fixed semantic four (green/orange/red/blue).
- **Don't** invent an intermediate shadow weight. A surface is resting (no shadow, or `shadow-xs` on a `GroupedList` row) or floating (`shadow-lg`/the tuned popover shadow) — nothing in between.
- **Don't** default new body copy to regular weight; medium is the system default.
- **Don't** reach for a full-screen `Modal` for anything beyond a short yes/no confirmation — that's what `DialogModal` is for; everything else (options, pickers) is a bottom sheet.
- **Don't** hard-code colors (`#fff`, `"#999"`, `text-white` on a surface) — use a role so Paper and Black keep working (see Colors).
