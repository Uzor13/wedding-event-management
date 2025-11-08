# Backend Migration to Next.js - Completion Guide

## ✅ What's Been Completed

### Database & Models
- ✅ MongoDB connection utility (`lib/db/mongodb.ts`)
- ✅ Guest model with TypeScript types
- ✅ Couple model with TypeScript types
- ✅ Setting model with TypeScript types
- ✅ Tag model with TypeScript types
- ✅ All models use Next.js-compatible caching

### Authentication
- ✅ JWT authentication utility (`lib/auth.ts`)
- ✅ Token generation and verification
- ✅ `/api/admin/login` - Admin login
- ✅ `/api/admin/couple/login` - Couple login
- ✅ `/api/admin/couples` GET - List all couples
- ✅ `/api/admin/couples` POST - Create new couple

### Environment Configuration
- ✅ `.env.local` with all required variables:
  - MongoDB URI
  - JWT Secret
  - SMS credentials (AfricasTalking)
  - Twilio credentials
  - Termii API key

## 📋 API Routes Still To Migrate

### Guest Management Routes

Create these files in `app/api/admin/`:

#### 1. `/api/admin/add-guest` (POST)
**File:** `app/api/admin/add-guest/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `addGuest` function
**Description:** Add a new guest to the system
**Auth:** Required (admin or couple)

#### 2. `/api/admin/guests` (GET)
**File:** `app/api/admin/guests/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `getAllGuests` function
**Description:** Get all guests with pagination and filtering
**Auth:** Required (admin or couple)

#### 3. `/api/admin/verify-guest` (POST)
**File:** `app/api/admin/verify-guest/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `verifyGuest` function
**Description:** Verify guest using QR code or unique ID
**Auth:** Required (admin or couple)

#### 4. `/api/admin/import` (POST)
**File:** `app/api/admin/import/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `importGuestsFromCsv` function
**Description:** Import guests from CSV file
**Auth:** Required (admin or couple)

#### 5. `/api/admin/delete/[phoneNumber]` (DELETE)
**File:** `app/api/admin/delete/[phoneNumber]/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `deleteGuest` function
**Description:** Delete a guest by phone number
**Auth:** Required (admin or couple)

#### 6. `/api/admin/confirm-rsvp/[uniqueId]` (POST)
**File:** `app/api/admin/confirm-rsvp/[uniqueId]/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `confirmRsvp` function
**Description:** Confirm RSVP for a guest
**Auth:** Required (admin or couple)

#### 7. `/api/admin/send-sms` (POST)
**File:** `app/api/admin/send-sms/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `sendSms` function
**Description:** Send SMS invitations to guests
**Auth:** Required (admin or couple)

### Guest Public Routes

Create these files in `app/api/`:

#### 8. `/api/rsvp/[uniqueId]` (GET)
**File:** `app/api/rsvp/[uniqueId]/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `getGuestByUniqueId` function
**Description:** Get guest invitation details (public route)
**Auth:** Not required

#### 9. `/api/rsvp/[uniqueId]` (POST)
**File:** `app/api/rsvp/[uniqueId]/route.ts`
**Source:** `wedding-rsvp-backend/controllers/guestController.js` - `updateRsvpStatus` function
**Description:** Update RSVP status (public route)
**Auth:** Not required

### Settings Routes

Create these files in `app/api/settings/`:

#### 10. `/api/settings` (GET)
**File:** `app/api/settings/route.ts`
**Source:** `wedding-rsvp-backend/controllers/settingsController.js` - `getSettings` function
**Description:** Get settings for a couple
**Auth:** Required (admin or couple)

#### 11. `/api/settings` (POST)
**File:** `app/api/settings/route.ts`
**Source:** `wedding-rsvp-backend/controllers/settingsController.js` - `updateSettings` function
**Description:** Update settings for a couple
**Auth:** Required (admin or couple)

#### 12. `/api/settings/public` (GET)
**File:** `app/api/settings/public/route.ts`
**Source:** `wedding-rsvp-backend/controllers/settingsController.js` - `getPublicSettings` function
**Description:** Get public settings (for invitation pages)
**Auth:** Not required

### Tag Management Routes

Create these files in `app/api/tags/`:

#### 13. `/api/tags` (GET)
**File:** `app/api/tags/route.ts`
**Source:** `wedding-rsvp-backend/controllers/tagController.js` - `getAllTags` function
**Description:** Get all tags for a couple
**Auth:** Required (admin or couple)

#### 14. `/api/tags` (POST)
**File:** `app/api/tags/route.ts`
**Source:** `wedding-rsvp-backend/controllers/tagController.js` - `createTag` function
**Description:** Create a new tag
**Auth:** Required (admin or couple)

#### 15. `/api/tags/[id]` (DELETE)
**File:** `app/api/tags/[id]/route.ts`
**Source:** `wedding-rsvp-backend/controllers/tagController.js` - `deleteTag` function
**Description:** Delete a tag
**Auth:** Required (admin or couple)

#### 16. `/api/tags/assign` (POST)
**File:** `app/api/tags/assign/route.ts`
**Source:** `wedding-rsvp-backend/controllers/tagController.js` - `assignTags` function
**Description:** Assign tags to guests
**Auth:** Required (admin or couple)

## 📝 Migration Pattern for API Routes

Here's a template for migrating Express routes to Next.js:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/auth';
import YourModel from '@/lib/models/YourModel';

// For protected routes
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyAuth(request);

    // Check role if needed
    if (auth.role !== 'admin' && auth.role !== 'couple') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Your logic here
    const data = await YourModel.find();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// For public routes (no auth needed)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Your logic here

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### For Dynamic Routes (e.g., `[id]` or `[uniqueId]`)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    // Use id in your logic

    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
```

## 🔧 Utility Functions Needed

You may need to create these utility files:

### SMS Service (`lib/services/sms.ts`)
Migrate SMS sending logic from the backend's integration folder:
- AfricasTalking integration
- Twilio integration
- Termii integration

### QR Code Generation (`lib/services/qrcode.ts`)
Migrate QR code generation logic

### CSV Import (`lib/services/csv.ts`)
Migrate CSV parsing and import logic

## 🧪 Testing API Routes

After creating each route, test using:

```bash
# Start development server
npm run dev

# Test with curl
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test with authentication
curl -X GET http://localhost:3000/api/admin/guests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Or use tools like:
- Postman
- Thunder Client (VS Code extension)
- REST Client (VS Code extension)

## 🚀 Next Steps

1. **Start with core functionality:**
   - Migrate guest management routes first (add, list, delete)
   - Then settings routes
   - Finally tag management

2. **Test each route as you build it**

3. **Update frontend to use local API routes:**
   - Since `NEXT_PUBLIC_SERVER_LINK` is now `http://localhost:3000`
   - All API calls will automatically use Next.js API routes

4. **Remove dependency on separate backend:**
   - Once all routes are migrated and tested
   - The separate Express backend can be decommissioned

## 📚 Reference Files

All source code is in: `/Users/preciousuzochukwu/WebstormProjects/wedding-rsvp-backend/`

- Controllers: `controllers/`
- Routes: `routes/`
- Models: `models/` (already migrated)
- Utilities: `utils/`, `integration/`

## ⚠️ Important Notes

- All API routes in Next.js App Router must export named functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
- Use `NextRequest` and `NextResponse` types
- Database connection (`dbConnect()`) must be called in each route
- Always use try-catch blocks for error handling
- For file uploads, use Next.js `FormData` API
- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Server-only variables (like `JWT_SECRET`) should NOT start with `NEXT_PUBLIC_`
