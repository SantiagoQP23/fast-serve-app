---
name: Teikio
description: Fast, simple restaurant ordering, built for the floor.
colors:
  primary: "#1C1B19"
  on-primary: "#FFFFFF"
  primary-container: "#E8E8E8"
  on-primary-container: "#1C1B19"
  secondary: "#DCE7EE"
  on-secondary: "#1C1B19"
  secondary-container: "#2C4566"
  on-secondary-container: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#F2F2F2"
  surface-high: "#ECECEC"
  surface-container-low: "#F7F7F7"
  surface-bright: "#FFFFFF"
  text: "#1C1B19"
  on-surface: "#1C1B19"
  on-surface-variant: "#4A4A4A"
  icon: "#737373"
  border: "#DCDCDC"
  outline-variant: "#DCDCDC"
  divider: "#EEEEEE"
  inverse-surface: "#3A3A3A"
  on-inverse-surface: "#FFFFFF"
  muted-text: "#6B6B6B"
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
    fontWeight: 600
    lineHeight: "36px"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
  subtitle:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  body-secondary:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.5px"
rounded:
  md: "6px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-destructive:
    backgroundColor: "#FEE2E2"
    textColor: "#991B1B"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  card:
    backgroundColor: "{colors.surface-container-low}"
    rounded: "{rounded.md}"
    padding: "24px"
  card-outline:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    padding: "24px"
  chip-selected:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
  chip-unselected:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
  text-input:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "56px"
  label-default:
    backgroundColor: "#F5F5F5"
    textColor: "#525252"
    rounded: "{rounded.full}"
    padding: "4px 16px"
  label-success:
    backgroundColor: "#D1FAE5"
    textColor: "#065F46"
    rounded: "{rounded.full}"
    padding: "4px 16px"
  fab:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.2xl}"
    size: "64px"
  floating-toolbar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: Teikio

## Overview

**Creative North Star: "The Steady Hand"**

Teikio is used tableside, mid-service, often one-handed, by someone who can't afford to fumble the screen. The system reads like paper and ink: a white (or cream, or charcoal) page, gray paper surfaces, and ink-black as the one voice that marks what you can press. Controls are drawn the way you'd rule a notebook: tight 6px corners, a 1px ink line around anything outlined, and a single medium-weight sans carrying every size from page titles down to status pills. Nothing decorative competes with the task. There are no gradients, no display face and no ornamental icons, because the interface's job is to disappear into the order, the table or the ticket in front of the user.

The Material-shaped color roles (`primary` / `onPrimary` / `primaryContainer` / `secondary` / `secondaryContainer` / `surface*` / `onSurfaceVariant` / `inverseSurface`) already speak Android's language, even though the components are hand-built rather than native Material widgets. That middle ground is deliberate, and the system should keep leaning into it as it moves toward fuller Android conformance rather than abandon it for something more decorative.

**Key Characteristics:**
- One typeface (Plus Jakarta Sans), one accent (ink), no display/body pairing.
- Core primitives (cards, buttons, chips, inputs, selects, grouped rows) share a tight 6px radius. Larger radii are kept for touch-only controls and floating chrome.
- Outlines are drawn in ink (`primary`) on interactive elements. The pale hairline (`border`) is for resting fields and quiet dividers.
- Thin-stroke Lucide icons throughout, from one family, tinted `icon` gray by default.
- Two-tier elevation: content sits flat, and only floating elements cast a shadow.

## Colors

Paper and ink: a white page with neutral gray paper surfaces, ink-black as the only accent, and a pale ink-blue wash for "selected". Everything else is neutral, so screens read like a printed menu or a notebook rather than a tech dashboard.

### Primary
- **Ink Black** (`primary`): the app's only accent. Primary buttons, the FAB, switches, checkbox fills, the active tab underline, links, selection borders and checkmarks, refresh spinners, focus borders, and the ink outline on outlined buttons, cards and chips. A warm black, never pure `#000`.
- **On Ink** (`on-primary`): text and icons on Ink Black fills.
- **Ink Container** (`primary-container` / `on-primary-container`): the pale containment tone for primary-tinted surfaces, such as a `Label` with `color="primary"`.

### Secondary
- **Ink-Blue Wash** (`secondary`, with `on-secondary` text): the selected/active fill for filter chips, the active `FloatingToolbar` item, secondary buttons and the wheel-picker band. This is what "selected" looks like everywhere in the app, never the primary color itself. It's a barely-there blue on Light, a deeper dusty blue on Paper, and a deep navy on Dark.
- **Deep Ink Blue** (`secondary-container`, with `on-secondary-container` text): the stronger selected fill used by the active `SegmentedControl` segment.

### Neutral
- **Paper White** (`background`): the app canvas, the screen background and the bottom-sheet background.
- **Paper Surface** (`surface`): list fills, the wheel-picker well, the `FloatingToolbar` and surface buttons. One step darker than the canvas.
- **Paper Surface High** (`surface-high`): the `filled` input and the counter's step buttons, for anything that must read as a recessed well.
- **Surface Container Low** (`surface-container-low`): the default `Card` fill and occupied table tiles. A whisper above the canvas.
- **Surface Bright** (`surface-bright`): raised floating panels that stay plain white on Light (`DialogModal`, the `FloatingSearchBar`). It becomes cream on Paper and lifted charcoal on Dark.
- **Ink** (`text` / `on-surface`): primary text.
- **Muted Text** (gray-500): `small` and `caption` text, inactive tab text and field labels at rest. It's tuned a step darker than Tailwind's default so labels keep 4.5:1 contrast on Paper Surface.
- **Graphite Icon** (`icon`): the default tint for any `Icon` without an explicit color.
- **Hairline Border** (`border` / `outline-variant`): resting outlined inputs and selects, the outlined `IconButton`, the outline `Label`, and section dividers inside sheets.
- **Faint Divider** (`divider`): the lightest separator, for hairlines inside a card or list rather than around it.
- **Inverse Pill** (`inverse-surface` / `on-inverse-surface`): dark pills on the light themes, used only for the connection and sync indicators.

### Semantic
- **Success** (green/emerald), **Warning** (orange), **Error** (red), **Info** (blue): status labels and states (active/inactive, stock, form errors, IN_PROGRESS). These come from the standard Tailwind scales rather than the role set. Keep them as the semantic layer, and don't recruit Ink Black or the ink-blue wash for status meaning.

### Named Rules
**The One Accent Rule.** Ink is the only brand color. Selection is the Ink-Blue Wash, not a tint of the primary, and status is the semantic four, never the primary. Accent-like UI (spinners, checkmarks, focus borders) uses `primary`, never a hard-coded `blue-500`, and blue appears only where it means *info*. If a screen seems to need a second brand color, that's a decision for `new-work`, not a local choice.

**The Roles, Not Colors Rule.** Every color comes from a role in `constants/theme.ts` (`Palette`), used as a prefix-free class (`bg-surface`, `text-on-surface-variant`, `border-primary`) or through `usePalette()` / `tw.color()` when a prop needs a raw value. Never hard-code a hex, `white` or `bg-white` on a themed surface, and never compute a color in a module-level `StyleSheet.create`, because it won't follow the theme.

### Themes
The user picks a theme per device in Settings → Appearance (`useThemeStore`), and every role has a value in each palette:
- **Light** (default): white printer paper. White page, neutral gray surfaces, ink-black accent and a pale ink-blue wash. Tailwind's `gray` is swapped for the `neutral` scale (500 darkened to `#6B6B6B`).
- **Paper**: cream notebook paper. Warm off-white canvas (`#F4EFE6`), sand surfaces (`#EAE4D8`), warm-ink text and accent (`#24211D` on `#FBF8F2`), and a dusty ink-blue wash for selection (`#8FAFC4`). `gray` becomes the warm `stone` scale.
- **Black** (labelled "Dark"/"Oscuro"): dark paper. Warm charcoal canvas (`#141311`), surfaces `#1E1C19` / `#262420`, and raised panels a step lighter (`surface-bright` `#2E2B27`, so dialogs and the selected `ButtonGroup` pill lift above every other surface), ivory text, and ivory ink as the accent (`#EDE8DF` on `#141311`). Selection is deep navy (`#1F2A38`, text `#DCE4EE`), and the strong `secondary-container` inverts to a pale blue (`#B9C8DB`). Tailwind scales are remapped (`colorScaleOverrides`): `gray` becomes a warm charcoal ramp, pale shades (50–300) become dark fills and dark text shades (700+) become light, so `bg-red-100 text-red-800` still reads as a soft label.

The One Accent Rule holds in every theme. Printed receipts and QR codes stay black on white.

## Typography

**Body & Display Font:** Plus Jakarta Sans (regular / medium / semibold / bold) by default, with a system-ui/sans-serif fallback. The user can switch to **Nunito** per device in Settings → Font (`useThemeStore().font`), with the same weights, sizes and line heights. One family at a time for everything: no serif, no monospace, no separate display face.

**Font names come from `typography`** (`constants/theme.ts`), whose values follow the setting. Read them while rendering, never in a module-level `StyleSheet.create`, and never hard-code a family name. Both families load once in the root layout. `ThemedText` sets tabular (fixed-width) digits so prices and totals line up in either font.

**Character:** A single well-tuned grotesque carries page titles down to status pills. Every heading level is semibold, so hierarchy comes from size rather than switching weights. Body text defaults to **medium**, not regular, a deliberate legibility choice for a screen that gets glanced at rather than read.

### Hierarchy
- **Display / h1** (semibold, 32px/40px): the one or two screen titles that need it, such as the main menu title.
- **Headline / h2** (semibold, 28px/36px): empty-state and rare top-level headings.
- **Title / h3** (semibold, 22px/28px): screen and section headers, the `DialogModal` title, and detail-screen titles.
- **Subtitle / h4** (semibold, 18px/24px): card headings and primary list-row text (product, category and section names).
- **Body / body1** (medium, 16px/24px): the default text style, used for form values, primary row text and button labels.
- **Body secondary / body2** (regular, 14px/20px): descriptions and secondary row text. Chips and medium `Label`s use this size, overridden to medium or bold weight.
- **Label / small** (medium, 12px/16px, Muted Text): field labels, metadata and counts. It always renders in gray-500, never full-strength ink.
- **Caption** (medium, 14px/16px, uppercase, 0.5 letter-spacing, Muted Text): rare, for an explicit eyebrow tag.

### Named Rules
**The Medium-Body Rule.** Default body text is medium (500). Only `body2` drops to regular. Don't default new body copy to regular weight, because it will read lighter than everything around it.

**The Bold-Status Rule.** Status `Label` text is bold (700), or semibold on the `outline` color. A pill is read at a glance across a busy screen, so its text carries more weight than the body text next to it.

## Layout

Single-column, edge-padded screens (16px side gutters, `px-4`) topped by either a native stack header or a custom title row with a leading back chevron and a trailing overflow (`ellipsis-vertical`) `IconButton`. Sections stack with a consistent 16px (`gap-4`) rhythm, and related fields inside a card use the same 16px gap, so grouping comes from the card boundary rather than tighter internal spacing.

List and detail screens take one of three shapes:
- **A flat scrollable list** of `Card` rows or `GroupedList` tiles (swipeable for edit/delete on management screens). Simple lists such as tags and settings options drop the card entirely and use a plain row of name plus trailing `chevron-right`.
- **A filter rail** (horizontal chips for the top-level category, a wrapped chip column for the sub-category) beside a scrollable result list. It's used on both the ordering menu and the staff menu-management screen.
- **A detail screen with a `FloatingToolbar`** pinned at the bottom for its handful of direct actions (e.g. duplicate, edit, more). Its scroll content reserves bottom padding so the toolbar never hides the last row.

Each screen has one primary-action surface. A list screen gets a single bottom-right `Fab`. A form screen gets a header-trailing `Button`. A detail screen gets the `FloatingToolbar`. Never combine them on one screen.

**Large screens:** `ScreenLayout` caps forms and detail screens at 720dp (`CONTENT_MAX_WIDTH`) on tablets and centers them, and `fullWidth` opts out. Bottom sheets cap at 640dp. Two-pane layouts take over at an 840dp window width (`BREAKPOINTS.EXPANDED`, a Material window-size class), and panes reuse screens through an `embedded` prop. Landscape POS is the tablet target.

Bottom sheets (`ThemedBottomSheetModal`, painted in `background`) are the standard surface for "more options" on a selected item and for pickers, including the wheel pickers. A full-screen `Modal` is reserved for the small, confirmation-only `DialogModal`.

## Elevation & Depth

Two tiers, set by whether an element sits in the content flow or floats above it. Resting surfaces carry no shadow: depth comes from a fill step (canvas → Surface Container Low → Surface) or an ink/hairline outline. Floating elements cast a real shadow so the "this is above everything" read is unambiguous. On the light themes no element relies on shadow alone. On Dark, where shadows vanish, the surface steps carry the depth.

### Shadow Vocabulary
- **Resting lift** (`offset 0/2, opacity 0.06, radius 10, Android elevation 1`): `Card variant="elevated"`, the one sanctioned resting shadow. It's a wide, faint diffuse halo, and it requires the opaque Surface Container Low fill, because a transparent elevated surface renders no shadow on Android.
- **Docked float** (`shadow-sm`): chrome that floats but stays docked to an edge or a track. That covers the `FloatingToolbar`, the `FloatingSearchBar` and the active `SegmentedControl` segment.
- **Free float** (`shadow-lg`): `Fab` and `DialogModal`, the elements that sit fully above the page.
- **Popover** (`offset 0/4, opacity 0.12, radius 12, Android elevation 8`): the legacy anchored options popover. Don't reuse it.

### Named Rules
**The Flat-Content Rule.** Content surfaces (cards, list rows, inputs, chips) don't cast shadows. The only resting shadow is the explicit `elevated` card. Shadows are for things that float: docked chrome gets `shadow-sm`, free-floating elements get `shadow-lg`, and there are no other weights.

## Shapes

The 6px corner (`rounded-md`) is the system's signature. Every core primitive takes it: `Card` (all variants), `Button` (horizontal layout), `Chip` (all variants), `TextInput`, `Select`, and every `GroupedList` tile (all four corners, stacked with a 4px gap, so they read as separate ruled slips rather than one continuous block).

Larger shapes have specific, limited jobs:
- **24px** (`rounded-3xl`): touch-only controls and their tracks. That covers the `IconButton`, the `SegmentedControl` and `ButtonGroup` tracks and active segments, the counter's value well, the wheel-picker well and its center band, and the `FloatingSearchBar`.
- **16px** (`rounded-2xl`): the free-floating elements, `Fab` and `DialogModal`.
- **Pill** (`rounded-full`): status `Label`s, the `FloatingToolbar` and its items, the vertical icon+label button layout, avatars and status dots.
- **12px** (`rounded-xl`): the legacy `Popover` only.

Many screen-level views still carry 8–24px radii from before the 6px migration (e.g. the 8px table tiles on the home grid). Treat those as migration debt to fold toward 6px when a screen is touched, not as precedent.

### Named Rules
**The 6px Rule.** Any new content primitive, whether a card, button, chip, input or list tile, takes the 6px radius. Use 24px only for a touch-only control or its track, 16px only for a free-floating element, and the pill only for status, the floating toolbar or a circular control. Never round a content container fully.

**The Ink-Line Rule.** An outlined *interactive* element (outline button, outline card, unselected chip, checkbox) is drawn with a 1px ink line (`border-primary`). The pale hairline (`border`) is reserved for resting text fields, the outlined icon button, the outline label and dividers, all elements that should recede until touched.

## Components

### Buttons
Crisp ink slips: tight-cornered, flat and decisive.
- **Shape:** 6px radius in the horizontal layout, fully circular in the vertical icon+label layout.
- **Sizes:** five steps, from `extra-small` (12px/6px padding, 16px icon) through `small` (16px/10px), `medium` (24px/16px, the default), `large` (48px/32px) and `extra-large` (64px/48px). Icon and label sit 12px apart.
- **Primary:** an Ink Black fill with On Ink text and icon.
- **Outline:** a transparent fill with a 1px ink line and ink text and icon.
- **Secondary:** an Ink-Blue Wash fill with on-secondary text.
- **Surface:** a Paper Surface fill with ink text, for a lower-emphasis action.
- **Text:** a bare ink label with no fill or border.
- **Destructive:** a soft `red-100` fill with `red-800` text and a `red-900` icon, never a hard red fill.
- **Pressed / Disabled / Loading:** pressed drops to 80% opacity and disabled to 50%. When loading, a spinner in the foreground color replaces the label and the button keeps its size.

### IconButton
- 24px radius, 12px padding, so a 24px icon lands on a 48dp target. Variants are `text` (the default, bare), `filled` (ink), `secondary` (wash), `surface`, `outlined` (pale hairline) and `destructive` (`red-50`).

### Chips
- **Shape:** 6px radius, 16px/6px padding, 8px gap, body2 size at medium weight, ink text.
- **Variants:** `filter` (the default, toggle selection such as category or status tabs), `assist` (a one-off action that never fills), `input` (user-entered data such as tags, with a trailing `x` remove) and `suggestion` (label-only tap-to-choose).
- **Selected** (`filter` only): an Ink-Blue Wash fill. A leading `check` appears automatically when nothing else occupies the leading slot.
- **Unselected:** a transparent fill with a 1px ink line and gray-600 icons.
- **Input:** a Surface Container Low fill plus the ink line, since it represents entered data.
- **Assist:** never fills. Its icon is tinted ink, the one place a chip icon carries the primary color.

### Cards / Containers
- **Corner Style:** 6px on every variant.
- **Internal Padding:** 24px on all sides (`p-6`), regardless of variant.
- **Variants:** `default` uses a solid Surface Container Low fill with no border, for grouped settings, form containers, product variants and payment-method accounts. `outline` uses a transparent fill and a 1px ink line, for list-row cards that need a strong edge. `elevated` uses the Surface Container Low fill plus the resting-lift shadow (see Elevation).
- **Pressed:** 80% opacity, applied only when the card has an `onPress`.
- **Inactive:** an inactive record (product, category or section) renders its whole card at 50% opacity. The opacity drop *is* the inactive state.

### Inputs / Fields
- **Variants:** `outlined` (the default for both `TextInput` and `Select`) has a transparent fill and a 1px pale hairline at rest. `filled` has a Paper Surface High fill with no border at any state. Both are 56dp tall with a 6px radius and 12px side padding.
- **Label:** floating. It sits centered in the field like a placeholder when the field is empty and unfocused, then animates to a small caption pinned above the text on focus or once filled. It's gray at rest, ink while focused and red on error. Native `placeholder` text shows only while the field is focused and empty, as a format hint under the floated label.
- **Focus:** the `outlined` border becomes ink. `filled` shows focus only through the label.
- **Error:** the label, the border (`outlined` only) and an inline `small` message below the field all turn red.
- **Disabled:** 50% opacity on the whole field.

### Labels (status)
- **One style, app-wide:** a pastel 100-level fill with dark 700/800 text in bold, and no dot. Success is `emerald-100`/`emerald-800`, warning `orange-100`/`orange-800`, error `red-100`/`red-700`, info `blue-100`/`blue-700`, default `gray-100`/`gray-600`, and primary is the Ink Container. `outline` is a transparent pill with a hairline border and semibold on-surface-variant text.
- **Shape:** pill, in `medium` (16px/4px padding, body2 text, 18px icon) or `small` (12px/4px padding, small text, 14px icon). Optional leading and trailing icons take the status hue.
- **Choose status via `color` only.** There's no soft/tinted variant and no dot prop.

### Tabs & Segmented Choices
- **SegmentedControl `pill`** (the default): equal-width Paper Surface segments with 4px gaps. The active segment fills with Deep Ink Blue, takes the 24px radius and lifts with `shadow-sm`.
- **SegmentedControl `text`:** bare text tabs 20px apart, ink when active and Muted Text when inactive.
- **TabBar:** text tabs where the active tab gets a 2px ink underline.
- **ButtonGroup:** a Paper Surface High track with a 24px radius where the active option sits on a Surface Bright pill, with an `on-surface` icon (`on-surface-variant` when inactive).

### Floating Actions & Dialogs
- **Fab:** a 16px radius, Ink Black fill and `shadow-lg`. It's icon-only at rest (64dp square). An optional label grows the width with a short width-and-opacity animation rather than popping in.
- **DialogModal:** a 16px radius, Surface Bright fill, 24px padding and `shadow-lg` over a 50%-black scrim, at 80% width up to `max-w-md`. It has an h3 title, a regular-weight body message and a right-aligned Cancel/Confirm `Button` pair at `small` size. It's for short yes/no confirmations only.

### FloatingToolbar (signature component)
A pill-shaped bar of icon actions that floats over a detail screen: a Paper Surface fill, `shadow-sm`, and 8px/16px padding with 8px gaps when horizontal, or stacked when vertical. Items are circular. The active item fills with the Ink-Blue Wash, and pressed items drop to 70% opacity, disabled to 40%. Promote a detail screen's two or three most-used actions here (e.g. duplicate) instead of burying them in the more-options sheet.

### FloatingSearchBar
A bottom-docked search field: a Surface Bright fill, 24px radius and `shadow-sm`, inset 16px from the edges. It lifts with the keyboard. It keeps search within thumb reach on the long ordering and inventory lists.

### Navigation
- Screens use either the native stack header (title plus system back chevron) or, when they need a trailing overflow action, a custom row: a leading back chevron, an h3 title and a trailing `ellipsis-vertical` `IconButton`. The tab bar, where present, is reserved for top-level sections, never for in-flow actions.

### Bottom Sheets (signature pattern)
"More options" on a selected item is an `ActionsBottomSheet`: a title (plus an optional body2 subtitle) over a plain list of icon+label `Pressable` rows, 32px side padding, optionally split into titled sections separated by a hairline. It has no grouped-list tiles and no cards. The order is always **Edit → Activate/Deactivate → Delete**, with delete last and red. The legacy anchored `Popover` survives on a couple of older screens; don't add new uses. Create-item entry points open the shared `AddToInventoryOptions` sheet rather than navigating straight to a form.

### Named Rules
**The Always-Enabled Rule.** A blockable action (replacing an item that's already been delivered, editing a variant once some of it has shipped) stays visually enabled and tappable. The specific reason it can't proceed surfaces inline the moment its sheet or card opens. It's never shown as a grayed-out state and never explained by an `Alert` fired on tap. When two blocks always fire together, show the reason once. Once units are delivered, the variant choices in the order-detail sheet are hidden rather than dimmed, and the Replace section's reason is the only explanation shown.

### Wheel Picker (signature component)
A scrollable, haptic, iOS-style value picker (the `WheelColumn` primitive) for fast, tactile single-value selection without typing. It comes as hours+minutes (`TimeWheelPicker`, for order prep time) and hour-only (`HourWheelPicker`, for the low-stock email hour). Each column snaps over a fixed 5-row window inside a Paper Surface well with a 24px radius. An Ink-Blue Wash band with the same radius sits fixed at the center row. Items fade and shrink with distance from the center, and a light haptic tick fires on every settle. It lives in a bottom sheet with its own Done button, so the value saves only on confirm.

## Do's and Don'ts

### Do:
- **Do** give every new card, button, chip, input or list tile the 6px radius (`rounded-md`).
- **Do** draw outlined interactive elements with a 1px ink line (`border-primary`), and keep the pale `border` hairline for resting fields and dividers.
- **Do** use the Ink-Blue Wash (`secondary`) for selected/active state, never a tint of the primary.
- **Do** default new text fields and selects to `outlined`.
- **Do** pick a status `Label` by `color` alone. It's one solid pastel style with bold text.
- **Do** render an inactive record as its card at 50% opacity.
- **Do** put "more options" behind an `ActionsBottomSheet` in Edit → Activate/Deactivate → Delete order, with delete in red.
- **Do** keep a blockable action enabled and show its specific reason inline when the sheet or card opens.
- **Do** use Lucide icons through the shared `Icon` component, sized 16–24px (up to 32px+ only in vertical buttons), and let it fall back to the `icon` role color.
- **Do** keep body text at medium weight (500), and drop to regular only for `body2`.

### Don't:
- **Don't** introduce a second accent color. Ink is the only brand hue, and status uses the fixed semantic four.
- **Don't** put a shadow on a resting content surface other than `Card variant="elevated"`, or invent a shadow weight beyond `shadow-sm` (docked) and `shadow-lg` (free-floating).
- **Don't** copy the 8–24px radii still found in older screen-level views onto new content. They're migration debt.
- **Don't** reintroduce a soft/tinted `Label` style or a status dot on labels.
- **Don't** reach for a full-screen `Modal` beyond a short yes/no confirmation. Options and pickers go in a bottom sheet.
- **Don't** hard-code colors (`#fff`, `"#999"`, `bg-white`, `text-white` on a surface). Use a role so Paper and Dark keep working.
- **Don't** mix icon families. It's Lucide only, with no Ionicons, Material icons or filled sets.
