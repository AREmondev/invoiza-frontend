# Convex User RBAC - Complete Implementation

## Overview

A fully customizable Role-Based Access Control (RBAC) system integrated with your existing `RolePermissionManager` component and Convex backend.

## Features

✅ **Multi-tenant Support** - Organizations with isolated permissions  
✅ **Dynamic Roles** - Create custom roles with flexible permissions  
✅ **Module-wise Permissions** - Granular control per module  
✅ **Action-based Access** - View, Create, Edit, Delete, Export, Approve, Custom  
✅ **Real-time Updates** - Permissions update via Convex subscriptions  
✅ **Component Guards** - Conditionally render based on permissions  
✅ **Backend Protection** - Query and mutation-level permission checks  
✅ **Audit Logging** - Track all RBAC changes  
✅ **Main User Creation** - Easy setup for first admin user  

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
│   ├── setup.ts               # Initial setup (create main user) ⭐
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

This will:
- Generate the `_generated` folder
- Set up the Convex deployment
- Watch for changes

### 3. Create Main User

Visit `/setup` in your browser or use the API:

**Via UI:**
1. Go to `http://localhost:3000/setup`
2. Fill in organization and admin user details
3. Click "Create Organization & Admin Account"

**Via API:**
```typescript
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";

const createMainUser = useMutation(api["mutations/setup"].createMainOrganizationAndUser);

await createMainUser({
  organizationName: "My Company",
  organizationSlug: "my-company",
  userEmail: "admin@example.com",
  userName: "Admin User",
  authProvider: "email",
  authProviderId: "admin@example.com",
});
```

This automatically:
- ✅ Creates the first organization
- ✅ Creates a super admin user
- ✅ Seeds all permissions
- ✅ Creates default roles (Admin, Manager, Sales Person, Cashier)
- ✅ Assigns all permissions to admin role
- ✅ Assigns admin role to the main user

## Pages

### `/setup`
Initial setup page to create the first organization and super admin user.

### `/users`
User management page with:
- List all users
- Create new users
- Edit users
- Assign roles
- Delete users (soft delete)

### `/roles-permissions`
Role and permission management with:
- List all roles
- Create/edit/delete roles
- Permission matrix (assign permissions to roles)
- View all permissions

## Components

### `RolePermissionManager`
The main component for managing roles and permissions. Now fully integrated with Convex:

```tsx
import { RolePermissionManager } from "@/components/shared/RolePermissionManager";

<RolePermissionManager />
```

### `UserManagement`
Component for managing users:

```tsx
import { UserManagement } from "@/components/rbac/UserManagement";

<UserManagement />
```

### `PermissionGuard`
Component guard for conditional rendering:

```tsx
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

<PermissionGuard module="products" action="create">
  <Button>Create Product</Button>
</PermissionGuard>
```

## Hooks

### `usePermissions`
Get current user permissions:

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const { hasPermission, permissions, user, isSuperAdmin } = usePermissions();

  if (hasPermission("products", "create")) {
    // User can create products
  }
}
```

## API Reference

### Setup Mutations

- `api["mutations/setup"].createMainOrganizationAndUser` - Create first org and super admin
- `api["mutations/setup"].seedPermissions` - Seed all permissions

### User Queries

- `api["queries/users"].getUsers` - Get all users in organization

### User Mutations

- `api["mutations/users"].createUser` - Create new user
- `api["mutations/users"].updateUser` - Update user
- `api["mutations/users"].deleteUser` - Delete user (soft delete)

### Role Queries

- `api["queries/roles"].getRoles` - Get all roles in organization

### Role Mutations

- `api["mutations/roles"].createRole` - Create new role
- `api["mutations/roles"].updateRole` - Update role
- `api["mutations/roles"].deleteRole` - Delete role

### Permission Queries

- `api["queries/permissions"].getCurrentUser` - Get current user with permissions
- `api["queries/permissions"].getCurrentUserPermissions` - Get all user permissions
- `api["queries/permissions"].checkPermission` - Check single permission
- `api["queries/permissions"].getAllPermissions` - Get all permissions (admin)
- `api["queries/permissions"].getPermissionsByModule` - Get permissions by module

### Permission Mutations

- `api["mutations/permissions"].assignPermissionToRole` - Assign permission to role
- `api["mutations/permissions"].revokePermissionFromRole` - Revoke permission from role
- `api["mutations/permissions"].createCustomPermission` - Create custom permission
- `api["mutations/permissions"].createPermissionOverride` - Create user permission override
- `api["mutations/permissions"].deletePermissionOverride` - Delete permission override

## Default Roles

1. **Admin** (System Role)
   - Full system access
   - All permissions
   - Cannot be deleted

2. **Manager** (System Role)
   - Can manage sales, purchases, products, customers
   - Cannot manage users/roles
   - Cannot be deleted

3. **Sales Person** (System Role)
   - Can view and create sales
   - Can view products and customers
   - Cannot be deleted

4. **Cashier** (System Role, Default)
   - Can view sales, products, customers
   - Can create sales
   - Default role for new users
   - Cannot be deleted

## Customization

### Add Custom Permissions

```typescript
// In convex_user/mutations/permissions.ts
await createCustomPermission({
  module: "custom_module",
  action: "custom",
  customAction: "special_action",
  displayName: "Special Action",
  description: "Perform special action",
  category: "Custom",
  scope: "global",
});
```

### Create Custom Roles

Use the RolePermissionManager UI or API:

```typescript
await createRole({
  name: "custom_role",
  displayName: "Custom Role",
  description: "Custom role description",
  priority: 40,
  permissionIds: [/* permission IDs */],
});
```

## Notes

- The main user created via `/setup` is a **Super Admin** with all permissions
- Super admins bypass all permission checks
- System roles cannot be deleted (only custom roles)
- Permissions are seeded automatically when creating the main user
- All RBAC changes are logged in `rbacAuditLogs` table
- API paths use bracket notation: `api["mutations/users"]` not `api.mutations.users`

## Troubleshooting

### API not found errors

Make sure you've run `npx convex dev` in the `convex_user` folder to generate the API types.

### Permission checks not working

1. Check if user has active roles assigned
2. Verify permissions are seeded
3. Check if user is super admin
4. Verify organization ID matches

### Setup page not working

1. Make sure `convex_user/mutations/setup.ts` exists
2. Run `npx convex dev` to regenerate API
3. Check browser console for errors

## Next Steps

1. Set up authentication (Convex Auth recommended)
2. Create your first organization via `/setup`
3. Start using permission checks in your components
4. Customize roles and permissions as needed

For more details, see `CONVEX_USER_SETUP.md`.

