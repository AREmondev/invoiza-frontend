# Fix: "Could not find public function" Error

## The Problem

You're seeing errors like:
```
Could not find public function for 'queries/roles:getRoles'
Could not find public function for 'queries/permissions:getAllPermissions'
```

## The Solution

**Convex dev server needs to be running!**

### Step 1: Start Convex Dev Server

Open a new terminal and run:

```bash
cd convex_user
npx convex dev
```

This will:
- ✅ Connect to your Convex deployment
- ✅ Sync your functions
- ✅ Generate updated types
- ✅ Watch for changes

**Keep this terminal running!** The dev server needs to stay active.

### Step 2: Verify Functions Are Deployed

After running `npx convex dev`, you should see output like:
```
✓ Deployed functions:
  - queries/roles:getRoles
  - queries/permissions:getAllPermissions
  - queries/permissions:getCurrentUser
  - mutations/users:createUser
  ... etc
```

### Step 3: Restart Next.js

If your Next.js server is running, restart it:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Why This Happens

Convex functions are deployed to the cloud. When you:
1. Create new functions
2. Modify existing functions
3. Change the schema

You need to run `npx convex dev` to sync these changes to your deployment.

## Quick Fix

**Just run this in a separate terminal:**

```bash
cd /Users/emon/invoiza/invoiza-frontend/convex_user
npx convex dev
```

Then refresh your browser. The errors should disappear!

## If It Still Doesn't Work

1. **Check your .env.local:**
   ```bash
   cat .env.local | grep CONVEX
   ```
   Should show: `NEXT_PUBLIC_CONVEX_URL=https://earnest-cod-526.convex.cloud`

2. **Check if functions are exported:**
   - All functions in `convex_user/queries/` and `convex_user/mutations/` should have `export const functionName`

3. **Check Convex dashboard:**
   - Visit https://dashboard.convex.dev
   - Check if your functions are listed there

4. **Restart everything:**
   ```bash
   # Stop all servers
   # Then:
   cd convex_user && npx convex dev
   # In another terminal:
   npm run dev
   ```

## Expected Behavior

Once Convex dev is running:
- ✅ No more "Could not find public function" errors
- ✅ Functions work in your app
- ✅ Real-time updates work
- ✅ You can create users, roles, etc.

