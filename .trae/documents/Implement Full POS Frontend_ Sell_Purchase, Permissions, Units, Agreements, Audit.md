## Overview

- Build a complete POS frontend with mirrored Sell and Purchase pages, module/item-level permissions, unit conversions, agreement/fake-price compliance, audit logs, and configurable tables using shadcn/ui and TanStack Table.
- Operate in Public Mode initially (all actions allowed), with a Settings toggle to re-enable permission enforcement later.

## Permissions & Public Mode

- Roles contain permission names; permissions define module + actions; support item-level overrides.
- Implement a Settings flag “Public Mode” that, when enabled, makes `hasPermission`, `hasAny`, `hasAll` return true; when disabled, enforce role and item-level permissions.

## Sell & Purchase Pages

- Shared invoice editor layout: selectors (customer/party, billing name), line items table, totals summary, actions (preview, draft, finalize).
- Components reused: ProductSelector, LineEditor, ChargesSelector, AgreementWarning, AuditTimeline.

## Product Details & UX

- On product select, display name/SKU, base unit, available units with conversion factors, variations, stock status, recent price history, and agreement status.
- Quick switches for unit/variation; clean inline cards/panels for readability.

## Price History Popover

- Maintain `PriceHistoryEntry` with `customerId`, `productId`, optional `variationId`, `unitPriceCents`, `invoiceDate`.
- On price input focus, show last 5 prices for the selected customer+product(+variation); selecting updates line `unitPriceCents`.

## Live Price Updates

- Changing price immediately recalculates totals; preserve `originalPriceCents` for audit/compliance.
- Agreement check runs on each update; warnings/tooltips appear inline.

## Additional Charges

- Per-line charges: sum to `additionalChargesCents` on each line.
- Global charges: `AppliedAdditionalCharge[]` with percentage/fixed and `applyTo` scope (global/per_line/both).
- Settings: CRUD for charge types (enable/disable/delete); validate duplicates; persist order.

## Customer & Parties

- Show previous dues for selected customer/party; right panel displays recent transactions.
- Billing Name: when enabled in Settings, allow selecting a billing alias to set `billingName` independent of `customerId`.

## Table System

- TanStack Table + shadcn/ui: column show/hide, dynamic multi-field search, quick filters, export.
- Persist table preferences per user (`preferences.tableColumns`), applied to all relevant tables.

## Preview & Draft

- Preview modal renders the current invoice read-only view.
- Save as Draft persists the invoice state for later editing; Finalize locks sensitive fields and records audit entries.

## Payment Module

- Settings: CRUD payment methods (enable/disable/delete); manage sort order; persist in store.
- Invoice: multiple payments supported to compute `paidCents` and `dueCents`.

## Purchase Module Rules

- Editing prior purchases does not change product base/unit cost unless user explicitly edits cost; confirm before applying.
- Record before/after in audit logs.

## Sale Return Constraints

- Only return items from the original invoice; user can reduce quantities or remove lines; cannot add new products.
- Validate not exceeding original quantities.

## Units & Variations

- Unit Module: create units and conversion rules (e.g., box→pcs); display conversions in ProductSelector.
- `convertUnit(quantity, fromUnit, toUnit)` handles conversion via stored factors; variation-wise pricing updates default prices.

## Agreement & Fake Price

- Agreements define min/max unit prices and quantity ranges per customer+product(+variation)+unit, with validity dates and active status.
- On line update, `checkPriceAgreement(customerId, productId, unit, quantity, enteredPriceCents, variationId?)` returns compliance.
- If Fake Price is enabled and entered price < agreement min: set `unitPriceCents` to `agreementPriceCents`, keep `originalPriceCents`, and flag “Fake Price Applied”.

## History & Audit Logs

- Log: product CRUD, invoice create/update, sale returns, purchase updates, permission changes.
- Model: `AuditLog { action, actorId, timestamp, description, before, after, entityType, entityId }`.
- Wrap store actions to append entries; show per-entity `AuditTimeline`.

## Models & Stores

- Invoice: cents-based totals; fields for `billingName`, `lineItems` with `unitPriceCents`, `additionalChargesCents`, `totalPriceCents`, `originalPriceCents`, `agreementPriceCents?`.
- PriceHistoryEntry: `customerId`, `productId`, optional `variationId`, `unitPriceCents`, `invoiceDate`.
- Stores: `useInvoiceStore`, `useProductStore`, `useSettingsStore`, `useUserStore` with persist; totals computed in cents and formatted for display.

## Verification Plan

- Manual QA: product selection and details, price history popovers, live totals, agreement warnings & fake price, charges, draft/preview, billing name, returns.
- Confirm audit entries on actions; ensure Public Mode toggle enables full access.

## Deliverables

- Operational Sell & Purchase pages with the required UX.
- Settings modules for Additional Charges, Payment Methods, Billing Name toggle, Public Mode toggle.
- Corrected Role/Permission UI and working item/module gates (gated behind Public Mode).
- Visible audit timeline on invoice and product pages.

Please confirm this plan. Upon approval, I will implement the remaining logic, wire the components/stores, and validate the flows end-to-end.