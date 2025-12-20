/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_auth from "../actions/auth.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_permissionChecker from "../lib/permissionChecker.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as mutations_additionalCharges from "../mutations/additionalCharges.js";
import type * as mutations_auth from "../mutations/auth.js";
import type * as mutations_brands from "../mutations/brands.js";
import type * as mutations_categories from "../mutations/categories.js";
import type * as mutations_commissionAgents from "../mutations/commissionAgents.js";
import type * as mutations_customers from "../mutations/customers.js";
import type * as mutations_godowns from "../mutations/godowns.js";
import type * as mutations_invoices from "../mutations/invoices.js";
import type * as mutations_paymentMethods from "../mutations/paymentMethods.js";
import type * as mutations_payments from "../mutations/payments.js";
import type * as mutations_permissions from "../mutations/permissions.js";
import type * as mutations_products from "../mutations/products.js";
import type * as mutations_roles from "../mutations/roles.js";
import type * as mutations_setup from "../mutations/setup.js";
import type * as mutations_units from "../mutations/units.js";
import type * as mutations_users from "../mutations/users.js";
import type * as queries_additionalCharges from "../queries/additionalCharges.js";
import type * as queries_auditLogs from "../queries/auditLogs.js";
import type * as queries_auth from "../queries/auth.js";
import type * as queries_brands from "../queries/brands.js";
import type * as queries_categories from "../queries/categories.js";
import type * as queries_commissionAgents from "../queries/commissionAgents.js";
import type * as queries_customers from "../queries/customers.js";
import type * as queries_godowns from "../queries/godowns.js";
import type * as queries_invoices from "../queries/invoices.js";
import type * as queries_paymentMethods from "../queries/paymentMethods.js";
import type * as queries_payments from "../queries/payments.js";
import type * as queries_permissions from "../queries/permissions.js";
import type * as queries_priceHistory from "../queries/priceHistory.js";
import type * as queries_products from "../queries/products.js";
import type * as queries_roles from "../queries/roles.js";
import type * as queries_units from "../queries/units.js";
import type * as queries_users from "../queries/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/auth": typeof actions_auth;
  "lib/auditLog": typeof lib_auditLog;
  "lib/permissionChecker": typeof lib_permissionChecker;
  "lib/permissions": typeof lib_permissions;
  "mutations/additionalCharges": typeof mutations_additionalCharges;
  "mutations/auth": typeof mutations_auth;
  "mutations/brands": typeof mutations_brands;
  "mutations/categories": typeof mutations_categories;
  "mutations/commissionAgents": typeof mutations_commissionAgents;
  "mutations/customers": typeof mutations_customers;
  "mutations/godowns": typeof mutations_godowns;
  "mutations/invoices": typeof mutations_invoices;
  "mutations/paymentMethods": typeof mutations_paymentMethods;
  "mutations/payments": typeof mutations_payments;
  "mutations/permissions": typeof mutations_permissions;
  "mutations/products": typeof mutations_products;
  "mutations/roles": typeof mutations_roles;
  "mutations/setup": typeof mutations_setup;
  "mutations/units": typeof mutations_units;
  "mutations/users": typeof mutations_users;
  "queries/additionalCharges": typeof queries_additionalCharges;
  "queries/auditLogs": typeof queries_auditLogs;
  "queries/auth": typeof queries_auth;
  "queries/brands": typeof queries_brands;
  "queries/categories": typeof queries_categories;
  "queries/commissionAgents": typeof queries_commissionAgents;
  "queries/customers": typeof queries_customers;
  "queries/godowns": typeof queries_godowns;
  "queries/invoices": typeof queries_invoices;
  "queries/paymentMethods": typeof queries_paymentMethods;
  "queries/payments": typeof queries_payments;
  "queries/permissions": typeof queries_permissions;
  "queries/priceHistory": typeof queries_priceHistory;
  "queries/products": typeof queries_products;
  "queries/roles": typeof queries_roles;
  "queries/units": typeof queries_units;
  "queries/users": typeof queries_users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
