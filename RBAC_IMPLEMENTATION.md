# Complete RBAC Implementation Guide

## Overview

A fully customizable Role-Based Access Control (RBAC) system built with Convex for Next.js applications. This implementation provides:

- ✅ Multi-tenant support (organizations)
- ✅ Dynamic role creation and management
- ✅ Module-wise permission mapping
- ✅ Action-based permissions (view, create, edit, delete, export, approve, custom)
- ✅ Route-level protection
- ✅ Component-level protection
- ✅ Backend query/mutation protection
- ✅ Real-time permission updates
- ✅ Permission overrides (user-specific)
- ✅ Audit logging

## Folder Structure

```
convex/
├── schema.ts                    # Database schema (organizations, users, roles, permissions)
├── lib/
│   ├── permissions.ts          # Permission constants and definitions
│   └── permissionChecker.ts    # Core permission checking logic
├── queries/
│   ├── permissions.ts          # Permission queries
│   ├── users.ts                # User queries
│   └── roles.ts                # Role queries
├── mutations/
│   ├── users.ts                # User CRUD operations
│   ├── roles.ts                # Role CRUD operations
│   └── permissions.ts          # Permission management
└── _generated/                 # Auto-generated Convex types

hooks/
└── usePermissions.ts           # React hooks for permission checking

components/
└── rbac/
    ├── PermissionGuard.tsx     # Component guards
    ├── RouteGuard.tsx          # Route guards
    └── UserManagement.tsx      # User management UI

lib/
└── convex.ts                   # Convex client setup

app/
└── providers/
    └── convex-provider.tsx     # Convex provider wrapper
```

## Database Schema

### Tables

1. **organizations** - Multi-tenant organizations
2. **users** - User accounts with organization membership
3. **roles** - Organization-scoped roles
4. **permissions** - Global permission definitions
5. **rolePermissions** - Role-permission mappings
6. **userRoles** - User-role assignments
7. **permissionOverrides** - User-specific permission overrides
8. **rbacAuditLogs** - Audit trail for all RBAC changes

## Setup Instructions

### 1. Initialize Convex

```bash
npx convex dev
```

### 2. Set Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Set Up Authentication

Install Convex Auth:

```bash
npm install @convex-dev/auth
```

Or implement custom authentication. Update the `getCurrentUser` helper in all query/mutation files.

### 4. Seed Permissions

Run once to initialize all permissions:

```typescript
// In Convex dashboard
await convex.mutation(api.mutations_permissions.seedPermissions, {});
```

### 5. Wrap App with Provider

Update `app/layout.tsx`:

```tsx
import { ConvexClientProvider } from "@/app/providers/convex-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

## Usage Examples

### Frontend - Check Permissions

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const { hasPermission, permissions, user } = usePermissions();

  if (hasPermission("products", "create")) {
    // User can create products
  }

  return <div>...</div>;
}
```

### Frontend - Component Guard

```tsx
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

function MyComponent() {
  return (
    <PermissionGuard module="products" action="create">
      <Button>Create Product</Button>
    </PermissionGuard>
  );
}
```

### Frontend - Route Guard

```tsx
import { RouteGuard } from "@/components/rbac/RouteGuard";

export default function ProductsPage() {
  return (
    <RouteGuard module="products" action="view" redirectTo="/">
      <div>Products content</div>
    </RouteGuard>
  );
}
```

### Backend - Permission Check in Mutation

```typescript
import { hasPermission } from "../lib/permissionChecker";

export const createProduct = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    const canCreate = await hasPermission(ctx, {
      module: "products",
      action: "create",
      userId: user._id,
      organizationId: user.organizationId,
    });

    if (!canCreate) {
      throw new Error("Permission denied");
    }

    // Create product...
  },
});
```

## API Reference

### Queries

- `queries_permissions.checkPermission` - Check single permission
- `queries_permissions.getCurrentUserPermissions` - Get all user permissions
- `queries_permissions.getCurrentUser` - Get current user with permissions
- `queries_permissions.getAllPermissions` - Get all permissions (admin)
- `queries_permissions.getPermissionsByModule` - Get permissions by module
- `queries_users.getUsers` - Get all users in organization
- `queries_roles.getRoles` - Get all roles in organization

### Mutations

#### Users
- `mutations_users.createUser` - Create new user
- `mutations_users.updateUser` - Update user
- `mutations_users.deleteUser` - Delete user (soft delete)

#### Roles
- `mutations_roles.createRole` - Create new role
- `mutations_roles.updateRole` - Update role
- `mutations_roles.deleteRole` - Delete role

#### Permissions
- `mutations_permissions.seedPermissions` - Seed initial permissions
- `mutations_permissions.createCustomPermission` - Create custom permission
- `mutations_permissions.assignPermissionToRole` - Assign permission to role
- `mutations_permissions.revokePermissionFromRole` - Revoke permission from role
- `mutations_permissions.createPermissionOverride` - Create user permission override
- `mutations_permissions.deletePermissionOverride` - Delete permission override

## Modules and Actions

### Available Modules

- `dashboard` - Dashboard access
- `products` - Product management
- `customers` - Customer management
- `sales` - Sales management
- `purchases` - Purchase management
- `invoices` - Invoice management
- `reports` - Reports access
- `banking` - Banking transactions
- `settings` - System settings
- `users` - User management
- `roles` - Role management
- `permissions` - Permission management
- `audit_logs` - Audit log access

### Available Actions

- `view` - View/list resources
- `create` - Create new resources
- `edit` - Edit existing resources
- `delete` - Delete resources
- `export` - Export data
- `approve` - Approve actions
- `custom` - Custom actions (requires `customAction` parameter)

## Permission Scopes

- `global` - Organization-wide access
- `own` - Own records only
- `team` - Team records
- `department` - Department records

## Best Practices

1. **Always check permissions on the backend** - Frontend checks are for UX only
2. **Use route guards for page-level protection**
3. **Use component guards for feature-level protection**
4. **Log all permission changes** - Audit logs are automatically created
5. **Use permission overrides sparingly** - Prefer role-based permissions
6. **Test permission changes** - Verify users can/cannot access resources
7. **Use super admin carefully** - Super admins bypass all permission checks

## Security Considerations

- All permission checks happen on the backend
- Frontend checks are for UX only
- Super admin users bypass all checks
- Permission overrides can grant or deny specific permissions
- All RBAC changes are logged in audit logs
- Roles are organization-scoped for multi-tenant isolation

## Next Steps

1. Set up authentication (Convex Auth or custom)
2. Create initial organization
3. Seed permissions
4. Create default roles (Admin, Manager, User, etc.)
5. Assign roles to users
6. Test permission system
7. Customize permissions for your specific modules

For detailed setup instructions, see `SETUP_RBAC.md`.
For usage examples, see `README_RBAC.md`.

