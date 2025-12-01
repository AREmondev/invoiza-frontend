# Convex User RBAC Setup Guide

## Folder Structure

```
convex_user/
├── schema.ts                    # Database schema
├── lib/
│   ├── permissions.ts          # Permission constants
│   └── permissionChecker.ts    # Permission checking logic
├── queries/
│   ├── permissions.ts          # Permission queries
│   ├── users.ts               # User queries
│   └── roles.ts               # Role queries
├── mutations/
│   ├── setup.ts               # Initial setup (create main user)
│   ├── users.ts               # User mutations
│   ├── roles.ts               # Role mutations
│   └── permissions.ts         # Permission mutations
└── _generated/                # Auto-generated types
```

## Quick Start

### 1. Set Environment Variable

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 2. Initialize Convex

```bash
cd convex_user
npx convex dev
```

Or if using the main convex folder:

```bash
npx convex dev
```

### 3. Create Main User

Visit `/setup` in your browser or use the API:

```typescript
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";

const createMainUser = useMutation(api.mutations_setup.createMainOrganizationAndUser);

await createMainUser({
  organizationName: "My Company",
  organizationSlug: "my-company",
  userEmail: "admin@example.com",
  userName: "Admin User",
  authProvider: "email",
  authProviderId: "admin@example.com",
});
```

This will:
- Create the first organization
- Create a super admin user
- Seed all permissions
- Create default roles (Admin, Manager, Sales Person, Cashier)
- Assign all permissions to admin role
- Assign admin role to the main user

### 4. Seed Permissions (if needed separately)

```typescript
const seedPermissions = useMutation(api.mutations_setup.seedPermissions);
await seedPermissions({});
```

## API Reference

### Setup Mutations

- `mutations_setup.createMainOrganizationAndUser` - Create first org and super admin
- `mutations_setup.seedPermissions` - Seed all permissions

### User Queries

- `queries_users.getUsers` - Get all users in organization

### User Mutations

- `mutations_users.createUser` - Create new user
- `mutations_users.updateUser` - Update user
- `mutations_users.deleteUser` - Delete user (soft delete)

### Role Queries

- `queries_roles.getRoles` - Get all roles in organization

### Role Mutations

- `mutations_roles.createRole` - Create new role
- `mutations_roles.updateRole` - Update role
- `mutations_roles.deleteRole` - Delete role

### Permission Queries

- `queries_permissions.getCurrentUser` - Get current user with permissions
- `queries_permissions.getCurrentUserPermissions` - Get all user permissions
- `queries_permissions.checkPermission` - Check single permission
- `queries_permissions.getAllPermissions` - Get all permissions (admin)
- `queries_permissions.getPermissionsByModule` - Get permissions by module

### Permission Mutations

- `mutations_permissions.assignPermissionToRole` - Assign permission to role
- `mutations_permissions.revokePermissionFromRole` - Revoke permission from role
- `mutations_permissions.createCustomPermission` - Create custom permission
- `mutations_permissions.createPermissionOverride` - Create user permission override
- `mutations_permissions.deletePermissionOverride` - Delete permission override

## Frontend Integration

### Use Permissions Hook

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const { hasPermission, permissions, user } = usePermissions();

  if (hasPermission("products", "create")) {
    // User can create products
  }
}
```

### Use Permission Guards

```tsx
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

<PermissionGuard module="products" action="create">
  <Button>Create Product</Button>
</PermissionGuard>
```

### Use User Management

```tsx
import { UserManagement } from "@/components/rbac/UserManagement";

<UserManagement />
```

### Use Role Permission Manager

```tsx
import { RolePermissionManager } from "@/components/shared/RolePermissionManager";

<RolePermissionManager />
```

## Pages

- `/setup` - Initial setup (create main user)
- `/users` - User management
- `/roles-permissions` - Role and permission management

## Default Roles Created

1. **Admin** - Full system access (all permissions)
2. **Manager** - Can manage sales, purchases, products, customers (no user/role management)
3. **Sales Person** - Can view and create sales, view products and customers
4. **Cashier** - Can view sales, products, customers and create sales

## Notes

- The main user created via `/setup` is a **Super Admin** with all permissions
- Super admins bypass all permission checks
- System roles cannot be deleted (only custom roles)
- Permissions are seeded automatically when creating the main user
- All RBAC changes are logged in `rbacAuditLogs` table

