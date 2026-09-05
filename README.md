# Estatera

Estatera is a full-stack real-estate platform for discovering verified land, homes, and apartments; managing customer visits; and operating inventory, customers, marketing alerts, and reporting from an admin dashboard.

## Contents

- [Technology](#technology)
- [Features](#features)
- [Architecture](#architecture)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Key workflows](#key-workflows)
- [API areas](#api-areas)
- [SEO and deployment](#seo-and-deployment)

## Technology

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, Axios |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcryptjs |
| Media | Cloudinary + Multer |
| Email | Brevo transactional email |
| Maps | Leaflet, React Leaflet, LocationIQ |
| Reporting | jsPDF, jsPDF AutoTable, CSV export |
| Charts | Recharts |
| Languages | Lingui: English, Tamil, Hindi |

## Features

### Public property discovery

- Premium responsive home page and editorial property browsing experience.
- Browse land, houses, and apartments.
- Search by property name or location.
- Filter by property type, price, geolocation radius, and sort order.
- List/map discovery modes.
- Property detail pages with image/video media, location, amenities, price, size, favorite, share, comparison, visit request, EMI calculator, and downloadable PDF brochure.
- Related-property recommendations.
- Recently viewed properties stored locally on the customer device.
- Compare up to three properties side-by-side.
- Public contact form; inquiries are stored for the admin team.
- Custom responsive 404 page.
- Light/dark appearance mode and English/Tamil/Hindi interface support.

### Customer accounts and security

- Signup and login with JWT authentication.
- Protected account/profile pages.
- Profile editing and Cloudinary profile-image upload.
- Wishlist/favorites.
- Password recovery with email OTP:
  - six-digit cryptographically generated code;
  - hashed OTP storage;
  - 10-minute expiry;
  - resend cooldown;
  - reset token required before changing a password.
- Change password from Profile with current-password confirmation.
- Password policy: at least 8 characters containing uppercase, lowercase, and a number.
- Active-session management:
  - view devices/sessions;
  - sign out one other session;
  - sign out all other sessions;
  - revoked sessions lose API access.
- Blocking a customer prevents account use.

### Saved searches, alerts, and notifications

- Save the current search filters from the listings page.
- Saved searches are available in Profile and reopen as shareable filter URLs.
- Every active, unblocked customer receives a Brevo email when an admin publishes a new property.
- Saved-search preferences control personalised in-app matches and Daily/Weekly email digests.
- Saved-search matching uses title/location, property type, and maximum price.
- Persistent in-app notification center with unread count, history, links, and mark-all-read action.
- Real-time Socket.IO notifications for visit changes and property-search matches.

### Visit management

- Logged-in customers can request a visit for a property.
- Admin workflow statuses: Pending, Scheduled, Visited, Cancelled.
- Admin selects the customer appointment date/time and adds internal notes.
- Customer receives a notification when the appointment/status changes.
- Admin can mark a scheduled visit as completed and collect customer feedback/rating.
- Admin visit calendar:
  - month and week views;
  - filter by visit status, property, and assigned team member;
  - assign a team member;
  - drag scheduled appointments to a new date while retaining their time;
  - rescheduling notifies the customer.

### Admin inventory and property lifecycle

- Create, edit, and manage listings with multi-image/video upload to Cloudinary.
- Edit a listing while retaining or removing existing photos/videos.
- Inventory search and filters for status, type, lifecycle, and archive state.
- Server-side inventory pagination (10 listings per page).
- Bulk select and bulk status updates.
- Bulk archive.
- Archive and restore listings without permanent deletion.
- Archived and draft listings are hidden from public discovery/property pages.
- Property lifecycle:
  - Draft;
  - Published;
  - Sold;
  - Archived.
- Private listing preview before publishing.
- Publish/unpublish timestamps shown in inventory.
- Publishing a newly eligible listing triggers matching saved-search alerts.

### Admin operations

- Business analytics dashboard with live KPI cards, inventory value, visit trends, popularity data, ratings, sales value, revenue, and conversion metrics.
- Branded PDF executive intelligence report.
- Detailed CSV business snapshot with KPIs, top properties, and visit trends.
- User/community management:
  - dashboard metrics for members, active/restricted access, and saved properties;
  - search and filters;
  - card or table directory view;
  - 10 users per page pagination;
  - block/unblock users;
  - protected owner-account handling for `estatera.team@gmail.com`.
- Contact inquiry queue with New, Contacted, and Closed states.
- Mobile-responsive admin drawer, inventory cards, and notification behavior.

### SEO and PWA

- Canonical URLs, page titles, descriptions, Open Graph tags, Twitter cards, and theme metadata.
- Structured data for Estatera as a `RealEstateAgent`.
- Dynamic property metadata and `Product`/`Offer` structured data in the browser.
- `robots.txt` disallows private routes.
- Static sitemap for public core pages.
- Web app manifest, favicon, and service worker.

## Architecture

```text
frontend/                       React + Vite client
  src/pages/                    Public, account, and admin screens
  src/components/               Navigation, SEO, property, map, shared UI
  public/                       PWA assets, robots.txt, sitemap.xml

backend/
  server.js                     Express, MongoDB, Socket.IO bootstrap
  models/                       Mongoose schemas
  src/modules/                  Feature modules
    auth/                       Login, OTP reset, passwords, sessions
    user/                       Profiles, favorites, admin user controls
    listing/                    Listings, lifecycle, inventory
    visit/                      Requests, status, scheduling
    inquiry/                    Public contact inquiries
    savedSearch/                Saved searches and email matching
    notification/               Persistent notifications
    admin/                      Analytics
  src/middleware/auth.js        JWT, role, and ownership checks
```

## Run locally

Requirements: Node.js 20+ and a MongoDB database.

```powershell
# Terminal 1
cd backend
npm install
npm start
```

```powershell
# Terminal 2
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Build the frontend for production:

```powershell
cd frontend
npm run build
```

## Configuration

Create `backend/.env` with real values. Never commit this file.

```env
MONGO_URI=mongodb_connection_string
JWT_SECRET=long_random_secret
CLOUDINARY_CLOUD_NAME=cloudinary_cloud_name
CLOUDINARY_API_KEY=cloudinary_api_key
CLOUDINARY_API_SECRET=cloudinary_api_secret
BREVO_API_KEY=brevo_api_key
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_LOCATIONIQ_ACCESS_TOKEN=locationiq_public_key
VITE_SITE_URL=https://your-production-domain.example
VITE_EMAIL_SERVICE_ID=emailjs_service_id
VITE_EMAIL_TEMPLATE_ID=emailjs_template_id
VITE_EMAIL_PUBLIC_KEY=emailjs_public_key
```

### Email setup notes

- The sender currently configured in the code is `estatera.team@gmail.com`.
- Brevo must have a valid API key, verified sender, and the current server IP in its authorized-IP settings when that security setting is enabled.
- New-listing emails are broadcast to every active, unblocked customer whenever a property is published. Saved searches are used for personalised in-app matches and Daily/Weekly digests.

### LocationIQ setup notes

- LocationIQ is used for admin location lookup/reverse geocoding and map selection.
- The frontend only sends Estatera JWT headers to `VITE_API_URL`; it deliberately does not attach them to LocationIQ requests, preventing CORS preflight failures.

## Key workflows

### Publish and alert a property

1. Admin creates a listing and optionally previews it.
2. Save it as Draft or click Publish Property.
3. Draft remains private; Published is visible publicly.
4. On publish, every active customer receives the new-listing email.
5. The system also finds enabled saved searches that match the listing and creates personalised in-app notifications; Daily/Weekly searches are included in their next digest.

### Customer password reset

1. Customer chooses Forgot Password.
2. Enters the registered email and receives an OTP.
3. Enters the valid OTP before expiry.
4. Creates a compliant new password.
5. Signs in with the new password.

### Schedule a visit

1. Customer requests a visit from a property page.
2. Admin sets the appointment date/time and optionally assigns a team member.
3. Customer receives a notification.
4. Admin can reschedule from the calendar by dragging the appointment.
5. After the visit, admin marks it Visited and the customer can submit feedback.

## API areas

All API endpoints are served under `/api`.

| Area | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Signup, login, password reset, password change, sessions |
| Listings | `/api/listings` | Public browsing, detail, favorites, admin CRUD/lifecycle/inventory |
| Users | `/api/users` | Profiles, favorites, account status, admin user management |
| Visits | `/api/visits` | Visit requests, scheduling, feedback |
| Inquiries | `/api/inquiries` | Contact form and inquiry management |
| Saved searches | `/api/saved-searches` | Saved filters and email preferences |
| Notifications | `/api/notifications` | Notification history and read state |
| Admin | `/api/admin` | Analytics KPIs |

Protected routes require:

```http
Authorization: Bearer <jwt>
```

## SEO and deployment

1. Set `VITE_SITE_URL` to the final public domain before building the frontend.
2. Update the URLs in `frontend/public/sitemap.xml` and `frontend/public/robots.txt` if the domain changes.
3. Submit `/sitemap.xml` to Google Search Console.
4. Verify the deployed site serves SPA route fallbacks for `/listings`, `/property/:id`, and other frontend routes.
5. The current app uses client-side metadata updates. Google can process this in many cases; for guaranteed per-property previews on WhatsApp/Facebook/LinkedIn, add server-side rendering or prerendering at deployment time.

## Security notes

- Keep all API keys and secrets only in environment files.
- Rotate exposed keys immediately.
- Do not use frontend environment variables for private service secrets; browser-exposed variables are public by design.
- Use HTTPS in production.
- Keep Brevo authorized IP addresses restricted to real deployment IPs rather than enabling unrestricted access.

## Current limitations / future enhancements

- Dynamic sitemap generation for every published property.
- Server-side rendering/prerendering for guaranteed social preview crawlers.
- Phone/SMS OTP and visit reminders.
- Agent entities/permissions instead of free-text team-member assignment.
- Date-range analytics and dedicated agent conversion KPIs.
