# Authentication System Setup Guide

## Overview

A complete authentication system using:
- **NextAuth.js** - Session management and JWT tokens
- **Convex** - Backend database and queries
- **bcryptjs** - Password hashing
- **Email/Password** - Primary authentication method

## Features

✅ Email/Password authentication  
✅ JWT token-based sessions  
✅ Password hashing with bcrypt  
✅ Protected routes via middleware  
✅ User session management  
✅ Token-based permission verification  
✅ Secure password storage  

## Folder Structure

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts          # NextAuth API route
├── auth/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── signup/
│   │   └── page.tsx              # Signup page
│   ├── forgot-password/
│   │   └── page.tsx              # Password reset
│   └── error/
│       └── page.tsx              # Auth error page
└── providers/
    └── auth-provider.tsx         # NextAuth SessionProvider

convex/
├── mutations/
│   └── auth.ts                  # Auth mutations (register, updatePassword)
├── queries/
│   └── auth.ts                  # Auth queries (getUserByEmail, getAuthUser)
└── schema.ts                    # User schema with passwordHash

components/
└── auth/
    └── LogoutButton.tsx         # Logout component

hooks/
└── useAuth.ts                   # Auth hook

lib/
└── auth.ts                      # Server-side auth helpers

middleware.ts                     # Route protection
```

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Update Schema

The schema already includes `passwordHash` field in the users table.

### 3. Run Convex Dev

```bash
cd convex
npx convex dev
```

### 4. Test Authentication

1. Visit `/auth/signup` to create an account
2. Visit `/auth/login` to sign in
3. Protected routes will automatically redirect to login if not authenticated

## How It Works

### Authentication Flow

1. **Sign Up:**
   - User fills form on `/auth/signup`
   - Password is hashed with bcrypt
   - User created in Convex database
   - Redirects to login

2. **Sign In:**
   - User enters email/password on `/auth/login`
   - NextAuth verifies credentials with Convex
   - JWT token created and stored in cookie
   - User redirected to dashboard

3. **Session Management:**
   - NextAuth manages JWT tokens
   - Tokens stored in HTTP-only cookies
   - Session data includes user ID, email, name

4. **Permission Verification:**
   - Frontend passes user email to Convex queries
   - Convex queries verify user exists and get permissions
   - Permissions checked against user's roles

### Token-Based Verification

All Convex queries/mutations receive the user's email from the NextAuth session:

```typescript
// Frontend
const { data: session } = useSession();
const userEmail = session?.user?.email;

// Convex query
const user = useQuery(api["queries/permissions"].getCurrentUser, {
  userEmail: userEmail
});
```

## API Reference

### Auth Mutations

- `mutations/auth.register` - Create new user account
- `mutations/auth.updatePassword` - Change user password
- `mutations/auth.updateLastLogin` - Update last login timestamp
- `mutations/auth.requestPasswordReset` - Request password reset

### Auth Queries

- `queries/auth.getUserByEmail` - Get user by email (for login)
- `queries/auth.getAuthUser` - Get current authenticated user

### NextAuth API

- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token

## Protected Routes

All routes are protected by default via `middleware.ts`, except:
- `/auth/*` - Auth pages
- `/api/*` - API routes
- `/setup` - Initial setup page

## Usage Examples

### Check Authentication

```tsx
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Please sign in</div>;
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

### Use Auth Hook

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>User: {user?.name}</div>;
}
```

### Sign Out

```tsx
import { signOut } from "next-auth/react";

<button onClick={() => signOut()}>Sign Out</button>
```

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens in HTTP-only cookies
- ✅ CSRF protection via NextAuth
- ✅ Session expiration (30 days)
- ✅ Secure password validation
- ✅ Email verification support (ready for implementation)

## Next Steps

1. Add email verification
2. Add password reset email sending
3. Add "Remember me" functionality
4. Add social login (Google, GitHub) if needed
5. Add 2FA support if needed

## Troubleshooting

### "Not authenticated" errors

- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Check browser cookies are enabled
- Verify user exists in database

### Password not working

- Ensure password is hashed correctly
- Check bcrypt compare is working
- Verify user has `passwordHash` field

### Session not persisting

- Check `NEXTAUTH_SECRET` is set
- Verify cookies are not blocked
- Check session strategy is "jwt"

