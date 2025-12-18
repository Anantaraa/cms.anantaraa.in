# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Architecture Firm Management Panel - A production-ready React + Vite CMS for managing architecture firm operations including clients, projects, invoices, and financial tracking. Uses Supabase for authentication and a REST API backend for data management.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Configuration

Required environment variables in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_BASE_URL` - Backend REST API base URL (default: http://localhost:3000)

**Date Format Convention:**
The backend API expects all dates in `dd/mm/yyyy` format (e.g., `25/12/2025`). The frontend uses utility functions to convert between HTML date input format (YYYY-MM-DD) and API format.

## Architecture

### Authentication Flow
- **Supabase Auth** (`src/services/supabaseClient.js`) handles user authentication
- **AuthContext** (`src/contexts/AuthContext.jsx`) provides session state throughout the app
- **RequireAuth** component (`src/components/auth/RequireAuth.jsx`) protects routes
- **Axios interceptor** (`src/services/axiosClient.js`) automatically attaches Supabase access token to API requests via Authorization header

### API Integration Layer
The app uses a two-tiered API architecture:

1. **Axios Client** (`src/services/axiosClient.js`):
   - Configured with `VITE_API_BASE_URL`
   - Request interceptor: Attaches Supabase Bearer token
   - Response interceptor: Handles 401 errors globally

2. **API Service** (`src/services/api.js`):
   - **Critical**: Backend returns snake_case, frontend uses camelCase
   - Contains mappers that transform data between conventions
   - All API calls go through `handleRequest` or `handleListRequest` helpers
   - Backend wraps responses in `{ success: true, message: "...", data: {...} }` format
   - Endpoints organized by domain: `clients`, `projects`, `invoices`, `income`, `expenses`, `reports`, `dashboard`
   - **Date Conversion**: All dates must be converted using `formatApiDate()` before sending to API, and `formatInputDate()` when loading into forms

### Backend API Expectations
All endpoints prefixed with `/api/v1/`:
- `GET /clients`, `POST /clients`, `GET /clients/:id`, `PUT /clients/:id`, `DELETE /clients/:id`
- `GET /projects`, `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`
- `GET /invoices`, `POST /invoices`, `GET /invoices/:id`, `PUT /invoices/:id`, `DELETE /invoices/:id`
- `GET /income`, `POST /income`, `GET /income/:id`, `PUT /income/:id`, `DELETE /income/:id`
- `GET /expenses`, `POST /expenses`, `GET /expenses/:id`, `PUT /expenses/:id`, `DELETE /expenses/:id`
- `GET /reports/projects/:id/summary` - Project financial summary
- `GET /reports/clients/:id/summary` - Client financial summary
- `GET /reports/dashboard` - Overall dashboard metrics

**Key Field Names:**
- Clients: `contact_number` (not phone)
- Expenses: `expense_date`, `responsible_person`, `status` (no category field)
- Income: `amount_received`, `received_date`, `payment_method`, `invoice_id`, `status`
- All entities support `organization_id` for multi-tenancy

### Component Structure
- **Pages** (`src/pages/`): Top-level route components organized by feature
  - Dashboard, Clients, Projects, Invoices, Finance, Reports
- **Components** (`src/components/`): Reusable UI components
  - `auth/`: Authentication-related components
  - `dashboard/`: KPICard, ProjectProfitability, OutstandingInvoices (uses Recharts)
  - `layout/`: Sidebar, TopHeader
  - `common/`: RightDrawer (slide-in drawer with Escape key and overlay support)
- **Layouts** (`src/layouts/`): MainLayout with Sidebar + TopHeader + Outlet pattern
- **Contexts** (`src/contexts/`): React Context providers (currently AuthContext only)
- **Utils** (`src/utils/`): Utility functions
  - `dateUtils.js`: Date formatting functions (DD/MM/YYYY ↔ YYYY-MM-DD conversion)

### Routing
- Uses React Router v6 with nested routes
- MainLayout wraps all authenticated routes via `<Outlet />`
- All routes protected by RequireAuth component
- Login page is the only public route

### Styling
- Pure CSS with component-level CSS files (e.g., `Dashboard.css`, `KPICard.css`)
- No CSS-in-JS or utility frameworks
- Custom CSS for layout using flexbox/grid
- Icons provided by `lucide-react` library

## Key Patterns

### Data Transformation
When adding new API endpoints:
1. Add mapper function in `src/services/api.js` to transform snake_case → camelCase
2. Handle nested objects (e.g., `client.name` from `data.client?.name`)
3. Provide fallback values for all fields
4. Use `handleRequest` for single items, `handleListRequest` for arrays

### Component Data Fetching
Pages fetch data in `useEffect` with try/catch:
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await api.domain.getAll();
      setState(data);
    } catch (error) {
      console.error('Error', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Dashboard Metrics
Dashboard calculates KPIs by aggregating data from multiple endpoints. Stats include:
- Client counts (total/active)
- Project counts (running/planned/completed)
- Outstanding invoices (count/amount)
- Top 5 profitable projects
- Top 5 outstanding invoices

### Status Enums (per API)
**Client Status:**
- `active` - Active client
- `inactive` - Temporarily inactive
- `archived` - Archived client

**Project Status:**
- `planned` - Project in planning phase
- `ongoing` - Project in progress
- `paused` - Project temporarily paused
- `completed` - Project completed

**Invoice Status:**
- `draft` - Invoice in draft state
- `sent` - Invoice sent to client
- `overdue` - Payment overdue
- `paid` - Fully paid
- `partially_paid` - Partially paid (auto-updated when income recorded)

**Expense Status:**
- `pending` - Awaiting approval
- `approved` - Approved but not paid
- `rejected` - Rejected
- `paid` - Paid

**Income Status:**
- `received` - Payment received
- `pending` - Payment pending

### Common UI Patterns
**RightDrawer Component** (`src/components/common/RightDrawer.jsx`):
- Slide-in drawer from right side with overlay
- Supports Escape key to close, click overlay to close
- Prevents background scrolling when open
- Optional back button via `onBack` prop
- Configurable width via `width` prop (default: 500px)

**Date Handling** (`src/utils/dateUtils.js`):
- Frontend displays dates in dd/mm/yyyy format (e.g., 25/12/2025)
- HTML date inputs use yyyy-mm-dd format
- Backend API expects dates in dd/mm/yyyy format
- **Critical**: Always convert dates between formats when:
  - Loading from API: Use `formatInputDate(apiDate)` to convert dd/mm/yyyy → yyyy-mm-dd for HTML inputs
  - Sending to API: Use `formatApiDate(inputDate)` to convert yyyy-mm-dd → dd/mm/yyyy for API
  - Displaying: Use `formatDisplayDate(date)` to format dates for display
  - Default values: Use `getTodayApiDate()` for HTML date input default (returns yyyy-mm-dd)

## Deployment

Configured for Vercel with SPA routing (`vercel.json` rewrites all routes to `/index.html`).

For other platforms, ensure SPA rewrites are configured to handle client-side routing.
