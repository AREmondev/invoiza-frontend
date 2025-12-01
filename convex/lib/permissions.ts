/**
 * Permission Constants and Utilities
 * 
 * Defines all available modules and actions for the RBAC system
 */

export const MODULES = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  CUSTOMERS: "customers",
  SALES: "sales",
  PURCHASES: "purchases",
  INVOICES: "invoices",
  REPORTS: "reports",
  BANKING: "banking",
  SETTINGS: "settings",
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  AUDIT_LOGS: "audit_logs",
} as const;

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  EXPORT: "export",
  APPROVE: "approve",
  CUSTOM: "custom",
} as const;

export const PERMISSION_SCOPES = {
  GLOBAL: "global",
  OWN: "own",
  TEAM: "team",
  DEPARTMENT: "department",
} as const;

/**
 * Permission definitions for all modules
 * This is used to seed the permissions table
 */
export const PERMISSION_DEFINITIONS = [
  // Dashboard
  {
    module: MODULES.DASHBOARD,
    action: ACTIONS.VIEW,
    displayName: "View Dashboard",
    description: "Access to view the main dashboard",
    category: "Dashboard",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Products
  {
    module: MODULES.PRODUCTS,
    action: ACTIONS.VIEW,
    displayName: "View Products",
    description: "View product list and details",
    category: "Products",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PRODUCTS,
    action: ACTIONS.CREATE,
    displayName: "Create Products",
    description: "Create new products",
    category: "Products",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PRODUCTS,
    action: ACTIONS.EDIT,
    displayName: "Edit Products",
    description: "Edit existing products",
    category: "Products",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PRODUCTS,
    action: ACTIONS.DELETE,
    displayName: "Delete Products",
    description: "Delete products",
    category: "Products",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PRODUCTS,
    action: ACTIONS.EXPORT,
    displayName: "Export Products",
    description: "Export product data",
    category: "Products",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Customers
  {
    module: MODULES.CUSTOMERS,
    action: ACTIONS.VIEW,
    displayName: "View Customers",
    description: "View customer list and details",
    category: "Customers",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.CUSTOMERS,
    action: ACTIONS.CREATE,
    displayName: "Create Customers",
    description: "Create new customers",
    category: "Customers",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.CUSTOMERS,
    action: ACTIONS.EDIT,
    displayName: "Edit Customers",
    description: "Edit existing customers",
    category: "Customers",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.CUSTOMERS,
    action: ACTIONS.DELETE,
    displayName: "Delete Customers",
    description: "Delete customers",
    category: "Customers",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.CUSTOMERS,
    action: ACTIONS.EXPORT,
    displayName: "Export Customers",
    description: "Export customer data",
    category: "Customers",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Sales
  {
    module: MODULES.SALES,
    action: ACTIONS.VIEW,
    displayName: "View Sales",
    description: "View sales list and details",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SALES,
    action: ACTIONS.CREATE,
    displayName: "Create Sales",
    description: "Create new sales",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SALES,
    action: ACTIONS.EDIT,
    displayName: "Edit Sales",
    description: "Edit existing sales",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SALES,
    action: ACTIONS.DELETE,
    displayName: "Delete Sales",
    description: "Delete sales",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SALES,
    action: ACTIONS.APPROVE,
    displayName: "Approve Sales",
    description: "Approve sales orders",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SALES,
    action: ACTIONS.EXPORT,
    displayName: "Export Sales",
    description: "Export sales data",
    category: "Sales",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Purchases
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.VIEW,
    displayName: "View Purchases",
    description: "View purchase list and details",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.CREATE,
    displayName: "Create Purchases",
    description: "Create new purchases",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.EDIT,
    displayName: "Edit Purchases",
    description: "Edit existing purchases",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.DELETE,
    displayName: "Delete Purchases",
    description: "Delete purchases",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.APPROVE,
    displayName: "Approve Purchases",
    description: "Approve purchase orders",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PURCHASES,
    action: ACTIONS.EXPORT,
    displayName: "Export Purchases",
    description: "Export purchase data",
    category: "Purchases",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Invoices
  {
    module: MODULES.INVOICES,
    action: ACTIONS.VIEW,
    displayName: "View Invoices",
    description: "View invoice list and details",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.INVOICES,
    action: ACTIONS.CREATE,
    displayName: "Create Invoices",
    description: "Create new invoices",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.INVOICES,
    action: ACTIONS.EDIT,
    displayName: "Edit Invoices",
    description: "Edit existing invoices",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.INVOICES,
    action: ACTIONS.DELETE,
    displayName: "Delete Invoices",
    description: "Delete invoices",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.INVOICES,
    action: ACTIONS.APPROVE,
    displayName: "Approve Invoices",
    description: "Approve invoices",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.INVOICES,
    action: ACTIONS.EXPORT,
    displayName: "Export Invoices",
    description: "Export invoice data",
    category: "Invoices",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Reports
  {
    module: MODULES.REPORTS,
    action: ACTIONS.VIEW,
    displayName: "View Reports",
    description: "View all reports",
    category: "Reports",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.REPORTS,
    action: ACTIONS.EXPORT,
    displayName: "Export Reports",
    description: "Export report data",
    category: "Reports",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Banking
  {
    module: MODULES.BANKING,
    action: ACTIONS.VIEW,
    displayName: "View Banking",
    description: "View banking transactions",
    category: "Banking",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.BANKING,
    action: ACTIONS.CREATE,
    displayName: "Create Banking Transactions",
    description: "Create banking transactions",
    category: "Banking",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.BANKING,
    action: ACTIONS.EDIT,
    displayName: "Edit Banking Transactions",
    description: "Edit banking transactions",
    category: "Banking",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.BANKING,
    action: ACTIONS.DELETE,
    displayName: "Delete Banking Transactions",
    description: "Delete banking transactions",
    category: "Banking",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Settings
  {
    module: MODULES.SETTINGS,
    action: ACTIONS.VIEW,
    displayName: "View Settings",
    description: "View system settings",
    category: "Settings",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.SETTINGS,
    action: ACTIONS.EDIT,
    displayName: "Edit Settings",
    description: "Edit system settings",
    category: "Settings",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Users
  {
    module: MODULES.USERS,
    action: ACTIONS.VIEW,
    displayName: "View Users",
    description: "View user list and details",
    category: "Users",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.USERS,
    action: ACTIONS.CREATE,
    displayName: "Create Users",
    description: "Create new users",
    category: "Users",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.USERS,
    action: ACTIONS.EDIT,
    displayName: "Edit Users",
    description: "Edit existing users",
    category: "Users",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.USERS,
    action: ACTIONS.DELETE,
    displayName: "Delete Users",
    description: "Delete users",
    category: "Users",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Roles
  {
    module: MODULES.ROLES,
    action: ACTIONS.VIEW,
    displayName: "View Roles",
    description: "View role list and details",
    category: "Roles",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.ROLES,
    action: ACTIONS.CREATE,
    displayName: "Create Roles",
    description: "Create new roles",
    category: "Roles",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.ROLES,
    action: ACTIONS.EDIT,
    displayName: "Edit Roles",
    description: "Edit existing roles",
    category: "Roles",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.ROLES,
    action: ACTIONS.DELETE,
    displayName: "Delete Roles",
    description: "Delete roles",
    category: "Roles",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Permissions
  {
    module: MODULES.PERMISSIONS,
    action: ACTIONS.VIEW,
    displayName: "View Permissions",
    description: "View permission list",
    category: "Permissions",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.PERMISSIONS,
    action: ACTIONS.EDIT,
    displayName: "Edit Permissions",
    description: "Edit permission assignments",
    category: "Permissions",
    scope: PERMISSION_SCOPES.GLOBAL,
  },

  // Audit Logs
  {
    module: MODULES.AUDIT_LOGS,
    action: ACTIONS.VIEW,
    displayName: "View Audit Logs",
    description: "View audit log entries",
    category: "Audit",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
  {
    module: MODULES.AUDIT_LOGS,
    action: ACTIONS.EXPORT,
    displayName: "Export Audit Logs",
    description: "Export audit log data",
    category: "Audit",
    scope: PERMISSION_SCOPES.GLOBAL,
  },
] as const;

/**
 * Helper function to create permission identifier
 */
export function createPermissionId(module: string, action: string, customAction?: string): string {
  if (action === "custom" && customAction) {
    return `${module}:${action}:${customAction}`;
  }
  return `${module}:${action}`;
}

/**
 * Helper function to parse permission identifier
 */
export function parsePermissionId(permissionId: string): {
  module: string;
  action: string;
  customAction?: string;
} {
  const parts = permissionId.split(":");
  if (parts.length === 3 && parts[1] === "custom") {
    return {
      module: parts[0],
      action: parts[1],
      customAction: parts[2],
    };
  }
  return {
    module: parts[0],
    action: parts[1],
  };
}

