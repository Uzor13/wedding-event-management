# Wedding RSVP - Next.js Full-Stack Application

A comprehensive wedding RSVP management system built with Next.js 16, TypeScript, MongoDB, and Tailwind CSS.

## 🎉 Migration Status

This project has been migrated from a React (CRA) + Express architecture to a unified Next.js full-stack application.

### ✅ Completed

#### Frontend
- ✅ Next.js 16 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS v4 with custom theme
- ✅ Context providers (Auth & Settings)
- ✅ Protected routes with middleware
- ✅ UI components library
- ✅ Login page (Admin & Couple)
- ✅ Guest Form page (Add Guest)
- ✅ Navigation bar

#### Backend
- ✅ MongoDB connection with caching
- ✅ All Mongoose models (Guest, Couple, Setting, Tag)
- ✅ JWT authentication utilities
- ✅ Authentication API routes:
  - Admin login
  - Couple login
  - Create couple
  - List couples
- ✅ Environment configuration

### 📋 Still To Complete

#### Frontend Pages
- Guest List page (`/guests`)
- Invitation page (`/rsvp/[uniqueId]`)
- Verify Guest page (`/verify`)
- RSVP Confirmation page (`/confirm-rsvp/[uniqueId]`)
- Tag Management page (`/users/tags`)
- Settings page (`/settings`)
- Couples Management page (`/couples`)

#### Backend API Routes
- Guest management (16 endpoints)
- Settings management (3 endpoints)
- Tag management (4 endpoints)

**See detailed guides:**
- `MIGRATION_GUIDE.md` - Frontend migration guide
- `BACKEND_MIGRATION_GUIDE.md` - Backend migration guide

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (or MongoDB Atlas account)
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment variables:**

   The `.env.local` file is already configured with the database connection and all necessary credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Default Admin Credentials

- **Username:** admin
- **Password:** admin123

## 📁 Project Structure

```
wedding-rsvp-next/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── admin/               # Admin API endpoints
│   ├── login/                   # Login page
│   ├── page.tsx                 # Home page (Guest Form)
│   ├── layout.tsx               # Root layout with providers
│   └── globals.css              # Global styles
├── components/                   # React components
│   └── ui/                      # UI components
├── context/                      # React Context
│   ├── AuthContext.tsx          # Authentication state
│   └── SettingsContext.tsx      # Settings state
├── lib/                          # Utilities
│   ├── db/
│   │   └── mongodb.ts           # Database connection
│   ├── models/                  # Mongoose models
│   │   ├── Guest.ts
│   │   ├── Couple.ts
│   │   ├── Setting.ts
│   │   └── Tag.ts
│   ├── auth.ts                  # JWT utilities
│   └── utils.ts                 # Helper functions
├── middleware.ts                 # Route protection
├── .env.local                   # Environment variables
├── MIGRATION_GUIDE.md           # Frontend migration guide
├── BACKEND_MIGRATION_GUIDE.md   # Backend migration guide
└── package.json
```

## 🔐 Authentication Flow

1. User logs in via `/login`
2. Backend validates credentials
3. JWT token is generated and returned
4. Token is stored in localStorage and cookies
5. Middleware checks cookies for server-side route protection
6. Frontend uses token for API requests

## 📱 API Routes

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/couple/login` - Couple login

### Couples Management
- `GET /api/admin/couples` - List all couples
- `POST /api/admin/couples` - Create new couple

See `BACKEND_MIGRATION_GUIDE.md` for complete API documentation.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI, shadcn/ui pattern
- **State Management:** React Context API
- **HTTP Client:** Axios

### Backend
- **Runtime:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **SMS:** AfricasTalking, Twilio, Termii

## 📖 Documentation

- `MIGRATION_GUIDE.md` - Complete frontend migration guide
- `BACKEND_MIGRATION_GUIDE.md` - Complete backend migration guide with all API endpoints
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 Next Steps

1. **Migrate remaining frontend pages** - Follow `MIGRATION_GUIDE.md`
2. **Implement remaining API routes** - Follow `BACKEND_MIGRATION_GUIDE.md`
3. **Test all functionality**
4. **Deploy to production**

---

**Current Version:** 0.1.0 (Migration in Progress)
# wedding-event-management
# wedding-event-management
