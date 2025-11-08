# Wedding RSVP - React to Next.js Migration Guide

## What's Been Migrated ✅

### 1. Core Setup
- ✅ Next.js 16 with TypeScript
- ✅ Tailwind CSS v4 configured with custom theme
- ✅ All project dependencies installed
- ✅ Environment variables setup (`.env.local`)

### 2. Context Providers
- ✅ `AuthContext.tsx` - Authentication and session management
- ✅ `SettingsContext.tsx` - Settings and couple selection
- ✅ Both providers integrated into root layout

### 3. Middleware & Protection
- ✅ `middleware.ts` - Route protection and role-based access control
- ✅ Cookie-based session management for server-side protection

### 4. UI Components
- ✅ `button.tsx` - Button component with variants
- ✅ `card.tsx` - Card components
- ✅ `input.tsx` - Input component
- ✅ `checkbox.tsx` - Checkbox component
- ✅ `alert.tsx` - Alert notifications
- ✅ `navbar.tsx` - Navigation bar with Next.js Link
- ✅ `pagination.tsx` - Pagination component
- ✅ `lib/utils.ts` - Utility functions (cn)

### 5. Pages Migrated
- ✅ `/login` - Admin and Couple login
- ✅ `/` (home) - Guest Form (Add Guest)

## Pages That Need Migration 📝

The following pages still need to be migrated from React to Next.js. Follow the pattern established in the migrated pages:

### 1. Guest List Page (`/guests`)
**React Source:** `src/components/GuestList.js`
**Target:** `app/guests/page.tsx`

Key changes needed:
- Convert to TypeScript
- Replace `useNavigate` with `useRouter` from 'next/navigation'
- Replace `<Link>` from react-router-dom with Next.js `<Link>`
- Add `'use client'` directive at the top

### 2. Invitation Page (`/rsvp/[uniqueId]`)
**React Source:** `src/components/Invitation.js`
**Target:** `app/rsvp/[uniqueId]/page.tsx`

Key changes needed:
- Use dynamic route parameter: `params.uniqueId`
- Convert to TypeScript
- This is a public route (no NavBar needed)

### 3. Verify Guest Page (`/verify`)
**React Source:** `src/components/VerifyGuest.js`
**Target:** `app/verify/page.tsx`

### 4. RSVP Confirmation Page (`/confirm-rsvp/[uniqueId]`)
**React Source:** `src/components/RSVPConfirmation.js`
**Target:** `app/confirm-rsvp/[uniqueId]/page.tsx`

### 5. Tag Management Page (`/users/tags`)
**React Source:** `src/components/Tag.js`
**Target:** `app/users/tags/page.tsx`

### 6. Settings Page (`/settings`)
**React Source:** `src/components/Settings.js`
**Target:** `app/settings/page.tsx`

### 7. Couples Management Page (`/couples`)
**React Source:** `src/components/Couples.js`
**Target:** `app/couples/page.tsx`

## Migration Pattern

Here's the standard pattern for migrating a page:

```typescript
'use client'; // Required for client components

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // NOT from 'next/router'
import Link from 'next/link'; // For navigation links
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import NavBar from '@/components/ui/navbar';

// Define TypeScript interfaces for your data
interface YourDataType {
  id: string;
  // ... other fields
}

export default function YourPage() {
  const router = useRouter();
  const { token, isAdmin } = useAuth();

  // ... your component logic

  return (
    <>
      <NavBar />
      <div>
        {/* Your component JSX */}
      </div>
    </>
  );
}
```

### Key Differences: React Router → Next.js

| React Router | Next.js |
|--------------|---------|
| `useNavigate()` | `useRouter()` from 'next/navigation' |
| `navigate('/path')` | `router.push('/path')` |
| `<Link to="/path">` | `<Link href="/path">` |
| `<Route path="/users/:id">` | Create `app/users/[id]/page.tsx` |
| `useParams()` | Use params prop: `({ params })` |
| `process.env.REACT_APP_*` | `process.env.NEXT_PUBLIC_*` |

### Dynamic Routes in Next.js

For dynamic routes (e.g., `/rsvp/[uniqueId]`):

```typescript
export default function Page({ params }: { params: { uniqueId: string } }) {
  const uniqueId = params.uniqueId;
  // ... rest of component
}
```

## Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_SERVER_LINK=http://localhost:5000
```

## Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start
```

## Additional UI Components to Migrate

If you need additional UI components from the React app:

**Location:** `wedding-rsvp/src/components/ui/`

Components that might need migration:
- `AlertDialog.js` → `alert-dialog.tsx`
- `AlertDescription.js` → `alert-description.tsx`
- `AlertParts.js` → May need to be broken down

Follow the same TypeScript + Next.js patterns used for the already-migrated components.

## Testing Checklist

Before marking a page as complete:

- [ ] TypeScript types are properly defined
- [ ] No TypeScript errors
- [ ] Page loads without runtime errors
- [ ] Navigation works correctly
- [ ] Protected routes redirect to login when not authenticated
- [ ] Role-based access works (admin vs couple)
- [ ] API calls use NEXT_PUBLIC_SERVER_LINK
- [ ] Forms submit correctly
- [ ] Data fetching works
- [ ] Error handling is in place

## Troubleshooting

### Issue: "window is not defined"
**Solution:** Make sure the component has `'use client'` directive at the top

### Issue: "useRouter must be used in a client component"
**Solution:** Add `'use client'` directive and import from 'next/navigation' not 'next/router'

### Issue: Middleware not redirecting
**Solution:** Check that AuthContext is setting cookies properly (already implemented)

### Issue: Styles not applying
**Solution:** Verify Tailwind CSS is configured in `globals.css` and imported in layout

## Next Steps

1. Migrate remaining pages one by one following the pattern
2. Test each page thoroughly
3. Update any remaining UI components as needed
4. Test the full application flow
5. Deploy to production

## Notes

- The middleware handles route protection automatically
- Auth context manages both localStorage and cookies
- Settings context fetches data based on selected couple
- All API calls should use axios with Bearer token authentication
