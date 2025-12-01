# RBAC (Role-Based Access Control) Module

A fully customizable Role-Based Access Control system built with Convex for Next.js applications.

## Features

- ✅ **Multi-tenant Support**: Organizations/tenants with isolated permissions
- ✅ **Dynamic Roles**: Create custom roles with flexible permission assignments
- ✅ **Module-wise Permissions**: Granular permissions per module (products, sales, customers, etc.)
- ✅ **Action-based Access**: View, Create, Edit, Delete, Export, Approve, and Custom actions
- ✅ **Permission Overrides**: User-specific permission grants/denials
- ✅ **Real-time Updates**: Permissions update in real-time via Convex subscriptions
- ✅ **Route Guards**: Protect routes based on permissions
- ✅ **Component Guards**: Conditionally render components based on permissions
- ✅ **Backend Protection**: Query and mutation-level permission checks
- ✅ **Audit Logging**: Track all RBAC changes

## Setup

### 1. Install Dependencies

```bash
npm install convex
```

### 2. Initialize Convex

```bash
npx convex dev
```

This will:
- Create a Convex project
- Generate the `_generated` folder
- Set up authentication

### 3. Set Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. Seed Permissions

Run the seed mutation to initialize all permissions:

```typescript
// In Convex dashboard or via a script
await convex.mutation(api.mutations_permissions.seedPermissions, {});
```

### 5. Wrap Your App with Convex Provider

Update your `app/layout.tsx`:

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

## Usage

### Frontend Hooks

#### Check Permissions

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

#### Check Single Permission

```tsx
import { usePermission } from "@/hooks/usePermissions";

function MyComponent() {
  const { hasPermission } = usePermission("products", "view");

  if (!hasPermission) {
    return <div>No access</div>;
  }

  return <div>Content</div>;
}
```

### Component Guards

#### Single Permission Guard

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

#### Multiple Permissions Guard

```tsx
import { MultiplePermissionGuard } from "@/components/rbac/PermissionGuard";

function MyComponent() {
  return (
    <MultiplePermissionGuard
      permissions={[
        { module: "products", action: "view" },
        { module: "products", action: "create" },
      ]}
      requireAll={true} // Requires all permissions
    >
      <Button>Create Product</Button>
    </MultiplePermissionGuard>
  );
}
```

### Route Guards

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

### Backend Permission Checks

In your Convex mutations/queries:

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

- `queries_permissions.checkPermission` - Check if user has permission
- `queries_permissions.getCurrentUserPermissions` - Get all user permissions
- `queries_permissions.getCurrentUser` - Get current user with permissions
- `queries_permissions.getAllPermissions` - Get all permissions (admin)
- `queries_permissions.getPermissionsByModule` - Get permissions by module

### Mutations

#### Users
- `mutations_users.createUser` - Create new user
- `mutations_users.updateUser` - Update user
- `mutations_users.deleteUser` - Delete user
- `mutations_users.getUsers` - Get all users

#### Roles
- `mutations_roles.createRole` - Create new role
- `mutations_roles.updateRole` - Update role
- `mutations_roles.deleteRole` - Delete role
- `mutations_roles.getRoles` - Get all roles

#### Permissions
- `mutations_permissions.seedPermissions` - Seed initial permissions
- `mutations_permissions.createCustomPermission` - Create custom permission
- `mutations_permissions.assignPermissionToRole` - Assign permission to role
- `mutations_permissions.revokePermissionFromRole` - Revoke permission from role
- `mutations_permissions.createPermissionOverride` - Create user permission override
- `mutations_permissions.deletePermissionOverride` - Delete permission override

## Modules

Available modules (defined in `convex/lib/permissions.ts`):

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

## Actions

Available actions:

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

## Troubleshooting

### Permissions not updating

- Check if Convex is connected: `convex dev`
- Verify user has active roles assigned
- Check permission overrides aren't blocking access

### Route guard not working

- Ensure `ConvexClientProvider` wraps your app
- Check if user is authenticated
- Verify permission string matches exactly

### Backend permission check failing

- Ensure `hasPermission` is called with correct parameters
- Check user has active roles
- Verify permission exists in database

## Next Steps

1. Set up authentication (Convex Auth or custom)
2. Create initial organization
3. Seed permissions
4. Create default roles
5. Assign roles to users
6. Test permission system

For more information, see the [Convex documentation](https://docs.convex.dev).

