# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Primary user: **waiters/servers taking orders tableside** — floor staff moving fast during live service, on a phone, often one-handed. Design should prioritize their flows (ordering, tables, bills) above all others.

Other confirmed audiences, all sharing the same app with role-gated screens (`Roles` enum: `admin`, `owner`, `cook`, `waiter`, `cashier`, gated via `isAdminLevelRole()`):
- **Cooks / production staff** — work from production-area and order-ticket screens; printers produce kitchen tickets.
- **Cashiers** — handle bills and payment methods.
- **Owners/admins** — back-office: menu management, staff, printers, production areas, reports, subscription/billing.

## Product Purpose

A restaurant operations app covering order-taking, tables, bills/payments, kitchen ticket printing, menu management, inventory, staff, and reporting, all in one app with per-role screens. Success means staff can take and fulfill an order with minimal friction during real service.

## Positioning

**Fast, simple ordering** — per the user, the app's core promise is speed over feature depth, aimed at quick-service/casual restaurants (matches the internal slug "fast-serve-app"). The ordering path is the product's differentiator even though the app also covers kitchen, inventory, staff, and reporting.

## Operating Context

Used live during restaurant service across four physical contexts: the floor (tableside order-taking on a phone), the counter (a landscape tablet working as a POS/cashier station), the kitchen (order tickets via production-area thermal printers), and the back office (menu/staff/reports/subscription management, likely less time-pressured).

Phones are locked to portrait; tablets rotate, and the landscape counter/POS station is the confirmed tablet target (decided 2026-10-14). Tablet layouts are additive: the waiter phone flows must stay unchanged.

Restaurants are multi-tenant: staff join a restaurant via QR invite or by creating one (`app/join-restaurant`, `app/scan-qr-invite`, `app/create-restaurant`), and can belong to / switch between more than one restaurant. Owners manage a subscription/plan per restaurant (trial/active states, in-app purchases via `expo-iap`).

A dedicated `sync` module and a "Restaurant Offline Data" settings entry indicate the app is built to tolerate unreliable connectivity on the floor/kitchen and sync later — offline resilience is a first-class concern, not an edge case.

## Capabilities and Constraints

- **Platform detail**: ships as a React Native/Expo app to iOS and Android (bundle/package `com.teikio.app`) plus a static web export target; Android is the primary platform design should conform to going forward (per this session). Predictive Back is explicitly disabled on Android (`predictiveBackGestureEnabled: false` in `app.config.js`) — a deliberate existing setting, not an oversight to "fix."
- **Domains**: auth/roles, restaurants (multi-tenant, QR invite), orders (new order, cart, edit order, order tickets/"comandas"), tables, bills/payments, menu (sections/categories/products/options — consolidated into a single menu overview management screen at `app/(profile)/menu/overview`), inventory (stock lives on a dedicated `InventoryItem` entity tied to a product option, *not* on `Product`/`ProductOption` directly as of a 2026-09-22 migration), printers & production areas (kitchen ticket printing), staff, subscriptions, reports (best-selling products/categories, daily report, payment-method report), push notifications, transactions.
- **Stack**: Expo Router (typed routes) on React Native; React Query for data; Zustand-style stores per domain; `twrnc` (Tailwind) for styling; react-hook-form + zod for forms.
- **i18n**: English and Spanish (`locales/en`, `locales/es`), namespaced per domain; translations exist for every user-facing string.
- **Design system**: a single custom component library shared across iOS/Android, used on phone and tablet. **Decided (2026-10-28): the custom system is the deliberate direction, not Material 3.** Native Android *behavior* still applies (system back, touch targets, system bars, platform interaction expectations), but there is no Material look and no move toward Material components.

## Brand Commitments

- Name: **Teikio** (internal package/slug: `fast-serve-app`).
- `userInterfaceStyle: "light"` is set in `app.config.js`, but the component library already codes light/dark variants throughout (`useThemeColor`) — no evidence either appearance is the deliberate brand default beyond that config value.
- Type faces in use: Plus Jakarta Sans and Sen (Google Fonts, loaded in `ThemedText`) — no confirmed single "brand face" beyond what's already wired up.
- No logo, legal, or proof assets found in the repo to record.

## Evidence on Hand

None found (no case studies, testimonials, press, or benchmark data in the repo). Future work must not fabricate any of this.

## Product Principles

1. Waiters taking orders tableside are the primary user — every core flow should stay fast and usable one-handed under real service pressure.
2. Fast, simple ordering over feature depth — the ordering path is the product's core promise and shouldn't be compromised to serve the secondary (kitchen/inventory/staff/reporting) flows.
3. One app, every role — admins/owners, cooks, cashiers, and waiters all share the same app with role-gated screens, not separate apps.
4. Built for real restaurant conditions — offline resilience and physical constraints (thermal ticket printers, production areas) are first-class, not edge cases.
5. One custom component system, native Android behavior — the custom components are the product's deliberate identity, not something to swap for Material. Conform to Android in behavior (back, targets, system UI), never by adopting the Material look.

## Accessibility & Inclusion

- **Large touch targets (hard rule)**: interactive targets are at least 48dp, and the core floor flows (ordering, tables, bills) must be usable one-handed, with primary actions within thumb reach. Staff use the app fast, mid-service, often with one hand busy.
