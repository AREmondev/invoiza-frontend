# Convex Setup Instructions

## The Error

You're seeing this error:
```
Could not find public function for 'queries/roles:getRoles'
```

This happens because Convex needs to be initialized and running.

## Solution

### Option 1: Initialize Convex in convex_user folder (Recommended)

1. **Navigate to the convex_user folder:**
   ```bash
   cd convex_user
   ```

2. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   
   This will:
   - Create a Convex project (if not already created)
   - Generate the `_generated` folder with proper types
   - Start the Convex dev server
   - Watch for file changes

3. **Set the environment variable:**
   
   Create or update `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```
   
   The URL will be shown when you run `npx convex dev`

4. **Restart your Next.js dev server:**
   ```bash
   npm run dev
   ```

### Option 2: Move files to main convex folder

If you prefer to use the main `convex/` folder:

1. **Move all files from `convex_user/` to `convex/`:**
   ```bash
   cp -r convex_user/* convex/
   ```

2. **Update the import in `lib/convex.ts`:**
   ```typescript
   export { api } from "../convex/_generated/api";
   ```

3. **Initialize Convex:**
   ```bash
   npx convex dev
   ```

## Verify Setup

After running `npx convex dev`, you should see:
- ✅ Functions being registered
- ✅ A deployment URL
- ✅ No errors about missing functions

## Common Issues

### Issue: "Could not find public function"

**Solution:** Make sure:
1. `npx convex dev` is running
2. The functions are exported correctly (they are)
3. The `_generated` folder exists and is up to date

### Issue: "Module not found"

**Solution:** 
1. Check that `NEXT_PUBLIC_CONVEX_URL` is set in `.env.local`
2. Restart your Next.js dev server after setting the env variable

### Issue: Functions not updating

**Solution:**
1. Make sure `npx convex dev` is running
2. Check the terminal for any errors
3. The dev server should auto-reload when you save files

## Next Steps

Once Convex is running:

1. Visit `/setup` to create your first organization and admin user
2. The functions will be available and the errors will disappear
3. You can start using the RBAC system

## Quick Start Command

```bash
# Terminal 1: Start Convex
cd convex_user
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

Then visit `http://localhost:3000/setup` to create your first user!

