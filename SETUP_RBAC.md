# RBAC Setup Guide

## Quick Start

### 1. Install Convex CLI

```bash
npm install -g convex
```

### 2. Initialize Convex

```bash
npx convex dev
```

Follow the prompts to:
- Create a new Convex project (or link to existing)
- Set up authentication

### 3. Set Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. Set Up Authentication

Choose one:

#### Option A: Convex Auth (Recommended)

```bash
npm install @convex-dev/auth
```

See: https://docs.convex.dev/auth

#### Option B: Custom Auth

Implement your own authentication and update the `getCurrentUser` helper in:
- `convex/queries/permissions.ts`
- `convex/queries/users.ts`
- `convex/queries/roles.ts`
- `convex/mutations/*.ts`

### 5. Seed Permissions

Run this once to initialize all permissions:

```typescript
// In Convex dashboard or via script
await convex.mutation(api.mutations_permissions.seedPermissions, {});
```

### 6. Create Initial Organization

```typescript
// Create your first organization
const orgId = await convex.mutation(api.mutations_organizations.create, {
  name: "My Organization",
  slug: "my-org",
  plan: "pro",
});
```

### 7. Create Super Admin User

```typescript
// Create super admin user
const userId = await convex.mutation(api.mutations_users.createUser, {
  email: "admin@example.com",
  name: "Super Admin",
  organizationId: orgId,
  isSuperAdmin: true,
  authProvider: "email",
  authProviderId: "admin-id",
});
```

### 8. Wrap App with Provider

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

## Folder Structure

```
convex/
├── schema.ts                    # Database schema
├── lib/
│   ├── permissions.ts          # Permission constants
│   └── permissionChecker.ts    # Permission checking utilities
├── queries/
│   ├── permissions.ts          # Permission queries
│   ├── users.ts                # User queries
│   └── roles.ts                # Role queries
├── mutations/
│   ├── users.ts                # User mutations
│   ├── roles.ts                # Role mutations
│   └── permissions.ts          # Permission mutations
└── _generated/                 # Auto-generated types

hooks/
└── usePermissions.ts           # React hooks for permissions

components/
└── rbac/
    ├── PermissionGuard.tsx     # Component guards
    ├── RouteGuard.tsx          # Route guards
    └── UserManagement.tsx      # User management UI
```

## Testing

1. Create a test user
2. Create a test role
3. Assign permissions to role
4. Assign role to user
5. Test permission checks

## Next Steps

- Set up authentication
- Create default roles (Admin, Manager, User, etc.)
- Assign roles to users
- Test permission system
- Customize permissions for your modules

