# Wedding RSVP App - Improvement Recommendations

## 🚨 **CRITICAL - Fix Immediately**

### 1. **Security Vulnerabilities (URGENT)**

#### A. Exposed Credentials in .env.local
**Problem:** All API keys, database credentials, and secrets are exposed in the repository.

**Action Required:**
```bash
# 1. Revoke all exposed credentials immediately:
# - Termii API key
# - Twilio credentials
# - Africa's Talking keys
# - MongoDB connection string
# - JWT secret

# 2. Regenerate new credentials
# 3. Update .env.local with new values
# 4. Add to .gitignore if not already
# 5. Remove from git history if committed
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

#### B. Hardcoded Admin Credentials
**Problem:** Admin password is hardcoded in `app/api/admin/login/route.ts`

**Fix:**
```typescript
// Create new route: app/api/admin/init/route.ts
// One-time setup to create first admin in database
// Then remove hardcoded credentials

// Add Admin model
interface IAdmin {
  username: string;
  password: string; // bcrypt hashed
  createdAt: Date;
}

// Store admin credentials in database
// Add route to change admin password
```

#### C. Insecure Session Cookies
**Problem:** Session stored as plain JSON in cookie without security flags

**Fix:**
```typescript
// context/AuthContext.tsx
document.cookie = `${STORAGE_KEY}=${encryptedSessionId}; ` +
  `path=/; ` +
  `max-age=${60 * 60 * 24 * 7}; ` +
  `Secure; ` +        // Only HTTPS
  `HttpOnly; ` +      // Not accessible via JS
  `SameSite=Strict`;  // CSRF protection
```

#### D. Weak Code Generation
**Problem:** 4-digit codes (only 9000 combinations)

**Fix:**
```typescript
// lib/utils/idUtils.ts
export function generateCode(): string {
  // 6-digit alphanumeric: 2.2 billion combinations
  return crypto.randomBytes(4).toString('base64')
    .replace(/[^A-Z0-9]/gi, '')
    .substring(0, 6)
    .toUpperCase();
}
```

### 2. **Add Rate Limiting**

**Install:**
```bash
npm install express-rate-limit
```

**Implement:**
```typescript
// lib/middleware/rateLimit.ts
import { NextRequest } from 'next/server';

const requests = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(limit: number, windowMs: number) {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const record = requests.get(ip);

    if (!record || now > record.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= limit) {
      return { allowed: false, retryAfter: record.resetTime - now };
    }

    record.count++;
    return { allowed: true };
  };
}

// Usage in login routes
const loginLimit = rateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
```

### 3. **Add Input Validation**

**Install:**
```bash
npm install zod
```

**Create validation schemas:**
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const guestSchema = z.object({
  name: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^(\+?234|0)[789]\d{9}$/),
  coupleId: z.string().optional()
});

export const settingsSchema = z.object({
  eventTitle: z.string().max(200),
  coupleNames: z.string().max(200),
  eventDate: z.string(),
  eventTime: z.string(),
  venueName: z.string().max(300),
  venueAddress: z.string().max(500),
  colorOfDay: z.string().max(100),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
    // ... other colors
  }).optional()
});

// Usage in API routes
const body = await request.json();
const validated = guestSchema.parse(body); // Throws if invalid
```

---

## ⚠️ **HIGH PRIORITY - Fix This Week**

### 4. **Complete Missing Pages**

#### A. Settings Page (`/settings`)
```typescript
// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import NavBar from '@/components/ui/navbar';

export default function Settings() {
  const { token, coupleId, isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch settings
  // Form to edit event details
  // Color picker for theme
  // Save button

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <h1>Event Settings</h1>
        {/* Form here */}
      </div>
    </>
  );
}
```

#### B. Verify Guest Page (`/verify`)
```typescript
// app/verify/page.tsx
'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';

export default function VerifyGuest() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScan = async (result) => {
    // POST to /api/admin/verify-guest
    // Show success/error message
  };

  return (
    <div className="container mx-auto p-4">
      <h1>Verify Guest</h1>

      {scanning ? (
        <Scanner onScan={handleScan} />
      ) : (
        <button onClick={() => setScanning(true)}>
          Start Scanning
        </button>
      )}

      <div className="mt-4">
        <input
          placeholder="Or enter code manually"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <button onClick={() => handleVerify(manualCode)}>
          Verify
        </button>
      </div>
    </div>
  );
}
```

#### C. Couples Management Page (`/couples`)
```typescript
// app/couples/page.tsx
'use client';

// List all couples
// Create new couple form
// Display generated credentials
// Copy credentials functionality
```

#### D. Tag Management Page (`/users/tags`)
```typescript
// app/users/tags/page.tsx
'use client';

// List all tags
// Create tag form
// Assign guests to tags
// Drag-and-drop or checkboxes to assign
```

### 5. **Add Dashboard/Analytics**

Create a dashboard showing:
```typescript
// app/dashboard/page.tsx or update home page

interface Stats {
  totalGuests: number;
  confirmedRSVP: number;
  pendingRSVP: number;
  verifiedAtEvent: number;
  guestsByTag: { tagName: string; count: number }[];
}

// Display with charts:
// - Pie chart: Confirmed vs Pending
// - Bar chart: Guests by tag
// - Number cards: Total stats
// - Recent activity timeline
```

**Install charting library:**
```bash
npm install recharts
```

### 6. **Add Data Export**

```typescript
// lib/utils/export.ts
export function exportToCSV(guests: Guest[], filename: string) {
  const headers = ['Name', 'Phone', 'RSVP Status', 'Verified', 'Code'];
  const rows = guests.map(g => [
    g.name,
    g.phoneNumber,
    g.rsvpStatus ? 'Confirmed' : 'Pending',
    g.isUsed ? 'Yes' : 'No',
    g.code
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// Add "Export to CSV" button in guest list
```

### 7. **Improve Guest Table**

Add to `/guests` page:
```typescript
// Features to add:
- [ ] Pagination (show 50 guests per page)
- [ ] Sort by column (name, status, date added)
- [ ] Filter by RSVP status
- [ ] Filter by verification status
- [ ] Filter by tag
- [ ] Bulk select (checkboxes)
- [ ] Bulk delete
- [ ] Bulk send SMS
- [ ] Bulk tag assignment
```

### 8. **Add Edit Guest Functionality**

```typescript
// app/api/admin/guests/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAuth(request);
  const { name, phoneNumber } = await request.json();

  // Validate inputs
  // Update guest
  // Return updated guest
}

// Add "Edit" button in guest list
// Modal or inline editing
```

---

## 📊 **MEDIUM PRIORITY - Next 2 Weeks**

### 9. **Add Confirmation Dialogs**

```typescript
// components/ui/confirm-dialog.tsx
'use client';

import { useState } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({ ... }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Usage: Before delete
const [showConfirm, setShowConfirm] = useState(false);

{showConfirm && (
  <ConfirmDialog
    title="Delete Guest"
    message={`Are you sure you want to delete ${guest.name}?`}
    onConfirm={() => { deleteGuest(guest.phoneNumber); setShowConfirm(false); }}
    onCancel={() => setShowConfirm(false)}
  />
)}
```

### 10. **Add Loading States**

```typescript
// Create reusable spinner component
// components/ui/spinner.tsx
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
}

// Use in forms and buttons
<button disabled={loading}>
  {loading ? <Spinner size="sm" /> : 'Save'}
</button>
```

### 11. **Better Toast Notifications**

**Install:**
```bash
npm install sonner
```

**Replace Alert component:**
```typescript
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

// Usage in components
import { toast } from 'sonner';

toast.success('Guest added successfully!');
toast.error('Failed to send SMS');
toast.loading('Importing guests...');
```

### 12. **Add Search Debouncing**

```typescript
// lib/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in guest search
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  // Fetch guests with debouncedSearch
}, [debouncedSearch]);
```

### 13. **Add Keyboard Shortcuts**

```typescript
// lib/hooks/useKeyboardShortcut.ts
import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === key &&
        (!modifiers.ctrl || e.ctrlKey) &&
        (!modifiers.shift || e.shiftKey) &&
        (!modifiers.alt || e.altKey)
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, modifiers]);
}

// Usage
useKeyboardShortcut('n', () => openAddGuestModal(), { ctrl: true });
useKeyboardShortcut('/', () => focusSearch());
```

### 14. **Mobile Responsiveness**

Add responsive design to all pages:
```typescript
// Update navbar
<nav className="bg-gray-800 p-4">
  <div className="flex flex-col md:flex-row justify-between items-center">
    {/* Mobile: Stack vertically */}
    {/* Desktop: Horizontal layout */}
  </div>
</nav>

// Update tables for mobile
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>

// Or use card view on mobile
{isMobile ? (
  <div className="space-y-4">
    {guests.map(guest => (
      <div key={guest._id} className="bg-white p-4 rounded shadow">
        {/* Card layout */}
      </div>
    ))}
  </div>
) : (
  <table>...</table>
)}
```

---

## 🎨 **NICE TO HAVE - Next Month**

### 15. **Real-time Updates with WebSockets**

```bash
npm install socket.io socket.io-client
```

```typescript
// lib/socket.ts
import { Server } from 'socket.io';

export function initSocket(server) {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}

// Emit events when guests RSVP
io.emit('guest-rsvp', { guestId, name });
```

### 16. **Email Notifications**

```bash
npm install nodemailer
```

```typescript
// lib/services/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendInvitationEmail(
  to: string,
  guestName: string,
  rsvpLink: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Wedding Invitation',
    html: `
      <h1>Dear ${guestName},</h1>
      <p>You are invited to our wedding!</p>
      <a href="${rsvpLink}">Confirm your RSVP</a>
    `
  });
}
```

### 17. **Advanced Analytics**

```typescript
// app/analytics/page.tsx

// Add charts for:
- RSVP timeline (line chart showing confirmations over time)
- Guest distribution by tag (pie chart)
- Verification status (donut chart)
- SMS delivery status
- Daily check-in count

// Use Recharts or Chart.js
import { LineChart, PieChart, BarChart } from 'recharts';
```

### 18. **Multi-language Support**

```bash
npm install next-intl
```

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';

export default function LocaleLayout({ children, params: { locale } }) {
  return (
    <NextIntlClientProvider locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}

// messages/en.json
{
  "guest": {
    "add": "Add Guest",
    "name": "Name",
    "phone": "Phone Number"
  }
}
```

### 19. **PDF Invitation Generator**

```bash
npm install jspdf
```

```typescript
// lib/utils/pdf.ts
import jsPDF from 'jspdf';

export function generateInvitationPDF(guest: Guest, settings: Setting) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text(settings.eventTitle, 20, 20);

  doc.setFontSize(16);
  doc.text(`Dear ${guest.name},`, 20, 40);

  // Add QR code
  doc.addImage(guest.qrCode, 'PNG', 20, 60, 50, 50);

  doc.save(`invitation-${guest.name}.pdf`);
}
```

### 20. **Offline Support (PWA)**

```typescript
// next.config.ts
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true
});

// public/manifest.json
{
  "name": "Wedding RSVP",
  "short_name": "RSVP",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "theme_color": "#6F4E37",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "start_url": "/"
}
```

---

## 🧪 **TESTING & QUALITY**

### 21. **Add Unit Tests**

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/lib/utils/idUtils.test.ts
import { generateUniqueId, generateCode } from '@/lib/utils/idUtils';

describe('idUtils', () => {
  test('generateUniqueId returns 32 character string', () => {
    const id = generateUniqueId();
    expect(id).toHaveLength(32);
  });

  test('generateCode returns 6 character code', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
    expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
  });
});
```

### 22. **Add E2E Tests**

```bash
npm install --save-dev @playwright/test
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('admin can login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('http://localhost:3000/guests');
});
```

### 23. **Add Code Quality Tools**

```bash
npm install --save-dev eslint prettier husky lint-staged

# Add to package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 📈 **PERFORMANCE OPTIMIZATIONS**

### 24. **Add Database Indexing**

```typescript
// lib/models/Guest.ts
// Already has: guestSchema.index({ phoneNumber: 1, couple: 1 }, { unique: true });

// Add more indexes for common queries:
guestSchema.index({ couple: 1, rsvpStatus: 1 });
guestSchema.index({ couple: 1, isUsed: 1 });
guestSchema.index({ uniqueId: 1 });
guestSchema.index({ code: 1 });
```

### 25. **Implement Caching**

```bash
npm install redis ioredis
```

```typescript
// lib/cache/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedSettings(coupleId: string) {
  const cached = await redis.get(`settings:${coupleId}`);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const settings = await Setting.findOne({ couple: coupleId });

  // Cache for 1 hour
  await redis.setex(`settings:${coupleId}`, 3600, JSON.stringify(settings));

  return settings;
}
```

### 26. **Optimize Images**

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

### 27. **Add Pagination**

```typescript
// app/api/admin/guests/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const guests = await Guest.find(filter)
    .skip(skip)
    .limit(limit)
    .select('-qrCode')
    .sort({ createdAt: -1 });

  const total = await Guest.countDocuments(filter);

  return NextResponse.json({
    guests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
```

---

## 🚀 **DEPLOYMENT & DEVOPS**

### 28. **Set Up CI/CD**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

### 29. **Add Environment-specific Configs**

```typescript
// lib/config.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    mongoUri: process.env.MONGODB_URI,
  },
  production: {
    apiUrl: 'https://your-domain.com',
    mongoUri: process.env.MONGODB_URI_PROD,
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 30. **Add Monitoring**

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 📝 **SUMMARY CHECKLIST**

### Must Do (Week 1)
- [ ] Fix all exposed credentials
- [ ] Implement secure cookie handling
- [ ] Add rate limiting to auth endpoints
- [ ] Add input validation with Zod
- [ ] Complete missing pages (Settings, Verify, Couples, Tags)
- [ ] Add confirmation dialogs for delete actions

### Should Do (Week 2-3)
- [ ] Add dashboard with analytics
- [ ] Implement data export (CSV)
- [ ] Improve guest table (pagination, sort, filter)
- [ ] Add edit guest functionality
- [ ] Better loading states and notifications
- [ ] Mobile responsive design

### Nice to Have (Month 2)
- [ ] Real-time updates
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] PDF invitations
- [ ] PWA support
- [ ] Unit & E2E tests

---

## 🎯 **Expected Impact**

**Security Fixes:** Critical - Prevents data breaches
**Missing Pages:** High - Makes app fully functional
**Analytics:** High - Provides value to users
**UX Improvements:** Medium - Better user experience
**Advanced Features:** Low - Nice additions but not essential

**Estimated Development Time:**
- Critical fixes: 1 week
- High priority: 2 weeks
- Medium priority: 3 weeks
- Nice to have: 4+ weeks

Total for production-ready app: **6-8 weeks** of focused development
