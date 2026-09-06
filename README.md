# Estatera

**Estatera** is a premium full-stack real-estate platform for discovering verified land, houses, and apartments in Tamil Nadu. It combines a customer-facing property experience with an operations-focused admin workspace for inventory, visits, customers, analytics, alerts, and property lifecycle management.

## Highlights

- Premium responsive property discovery experience, including mobile/PWA support.
- Private pricing model: customers contact an advisor for commercial guidance.
- Secure customer accounts, password recovery, session management, and persistent notifications.
- End-to-end property, customer, visit, enquiry, and purchase-confirmation management.
- Real-time operational updates with Socket.IO and transactional emails through Brevo.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS 4 |
| UI | Framer Motion, Lucide icons, React Hot Toast, SweetAlert2 |
| Internationalisation | Lingui — English, Tamil, Hindi |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs, server-validated sessions |
| Uploads | Multer, Cloudinary, multer-storage-cloudinary |
| Email | Brevo transactional email |
| Maps | Leaflet, React Leaflet, LocationIQ / OpenStreetMap geocoding |
| Reporting | Recharts, jsPDF, jsPDF AutoTable, CSV export |
| PWA | Web App Manifest, Service Worker, offline app-shell caching |

## Features

### Customer property experience

- Editorial home page with verified-property trust indicators.
- Browse land, houses, and apartments in list or interactive map view.
- Search by locality or property title.
- Filter by property type, location radius, and sort order.
- Featured collections, trending listings, latest arrivals, and selected opportunities.
- Property detail pages with photo/video galleries, amenities, size, location, share links, comparison, wishlist, and related properties.
- Private commercial guidance instead of public price display.
- Direct **Call for details** action and a property-specific WhatsApp enquiry with customer information prefilled when available.
- Premium downloadable PDF brochure with private-pricing language.
- Compare properties side-by-side by availability, location, property type, size, status, and amenities.
- Recently viewed listings saved locally on the device.
- Custom responsive 404 page.

### Customer account and security

- Signup, login, logout, protected routes, and role-based admin access.
- Profile editing with Cloudinary profile-image upload.
- Wishlist/favourites and saved searches.
- Email OTP password recovery:
  - secure six-digit OTP;
  - hashed OTP storage;
  - expiration and resend cooldown;
  - reset token required before changing a password.
- Change password from Profile with password-strength validation.
- Active-session management: view sessions, sign out another session, or sign out all other sessions.
- Improved session names with device model on supported mobile browsers; Windows/browser/version details where browsers protect the physical PC model.
- Account blocking for administrators.

### Saved searches and alerts

- Save the active discovery search from desktop or mobile.
- Reopen saved searches from Profile.
- Search matching based on listing title/location, type, and budget criteria.
- Personalised immediate in-app saved-search matches.
- Daily and weekly saved-search email digest preferences.
- New-property email broadcast to active, unblocked customers when a property is published.

### Notification centre

- Persistent notification history with unread count, read state, links, and mark-all-read action.
- Real-time Socket.IO delivery for live users.
- Notifications for:
  - new verified properties;
  - saved-search matches;
  - favourite-property lifecycle changes;
  - enquiry received and enquiry status changes;
  - visit request status changes;
  - scheduled visit with exact India date/time;
  - 24-hour visit reminders;
  - visit completion or cancellation;
  - confirmed purchase;
  - signup, sign-in, password reset, and password change security events.

### Visit and purchase journey

- Customer visit requests with contact details and message.
- Admin scheduling with a specific appointment date, time, assigned team member, and private note.
- Visit statuses: Pending, Scheduled, Visited, Purchase Confirmed, and Cancelled.
- Automatic customer notifications based on the exact status—not merely the presence of a scheduled date.
- Calendar views for visit operations, including rescheduling support.
- Customer feedback after a completed visit.
- Purchase confirmation triggers a one-time celebratory customer experience and persistent notification.

### Admin workspace

- Protected AdminHub dashboard.
- Create, edit, preview, publish, unpublish, sell, archive, and restore listings.
- Property lifecycle: **Draft → Published → Sold → Archived**.
- Media upload for photos and videos via Cloudinary.
- Address search, map pin selection, and coordinate editing.
- Inventory filtering, server-side pagination, bulk status updates, and bulk archive.
- Responsive mobile inventory cards and responsive property creation form.
- Customer directory with modern card/table views, search, pagination, export, account blocking, and protected administrator safeguards.
- Enquiry management and visit operations.
- Analytics dashboard with listing, visit, engagement, inventory, conversion, revenue, feedback, and chart insights.
- CSV export and professionally formatted PDF report export.

### SEO, quality, and PWA

- Page-specific SEO title, description, canonical URL, Open Graph, Twitter card, and structured data.
- `robots.txt`, `sitemap.xml`, and responsive metadata.
- Mobile-safe headers, Leaflet map stacking, modals, sidebars, notification panels, and text sizing.
- Installable PWA manifest, app icon, standalone display mode, and Service Worker cache.

## Architecture

```text
frontend/                 React + Vite application
  src/pages/              Public, account, and admin screens
  src/components/         Reusable UI, maps, SEO, navigation
  public/                 Manifest, service worker, robots, sitemap

backend/
  src/modules/            Domain modules (auth, listing, visit, user, etc.)
  models/                 Mongoose schemas
  routes/                 Compatibility route adapters used by server.js
  config/cloudinary.js    Shared Cloudinary/Multer storage configuration
  utils/                  Email and supporting utilities
```

The modular backend owns business logic, controllers, routes, and repositories. The `models` and `routes` folders are required compatibility layers and must not be deleted.

## Local setup

### Prerequisites

- Node.js 20+
- MongoDB Atlas database or local MongoDB
- Cloudinary account
- Brevo account/API key for transactional emails

### 1. Install dependencies

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Configure environment variables

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_secret
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

BREVO_API_KEY=your_brevo_api_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_LOCATIONIQ_ACCESS_TOKEN=your_locationiq_public_token

# Optional: only if the Contact form uses EmailJS in addition to API storage
VITE_EMAIL_SERVICE_ID=your_service_id
VITE_EMAIL_TEMPLATE_ID=your_template_id
VITE_EMAIL_PUBLIC_KEY=your_public_key
```

Never commit `.env` files or API keys.

### 3. Run locally

Open two terminals:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

### 4. Production build

```powershell
cd frontend
npm run build
```

## Deployment notes

1. Deploy the backend first and set all backend environment variables.
2. Set the deployed frontend origin in backend `FRONTEND_URL` and CORS configuration.
3. Set the frontend `VITE_API_URL` to the backend origin **without a trailing slash**:

```env
VITE_API_URL=https://your-backend.onrender.com
```

4. Rebuild/redeploy the frontend after changing any `VITE_*` variable.
5. In Brevo, authorise your deployment IP if Brevo blocks an email request.
6. HTTPS is required in production for PWA installation and reliable service-worker behaviour.

## API areas

| Base path | Responsibility |
| --- | --- |
| `/api/auth` | Signup, login, OTP reset, password changes, sessions |
| `/api/listings` | Public discovery, lifecycle, inventory, uploads, archive |
| `/api/users` | Profile, favourites, customer directory, access control |
| `/api/visits` | Requests, scheduling, status, feedback, purchase confirmation |
| `/api/inquiries` | Customer contact enquiries and admin updates |
| `/api/saved-searches` | Saved filters and alert preferences |
| `/api/notifications` | Persistent customer notification centre |
| `/api/admin` | Administrative analytics |

## Operational reminders

- Restart the backend after changing backend code or `.env` settings.
- Sign out and sign in after the improved device-session label is deployed; existing sessions retain their old browser data.
- A purchase celebration is only triggered when an admin selects **Purchase Confirmed** for the correct customer visit.
- New notification records reflect current logic; historical records are intentionally preserved.

## Contact

For property guidance, call or WhatsApp **Estatera** at **+91 97916 74849**.

