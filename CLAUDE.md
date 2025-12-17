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
   - Endpoints organized by domain: `clients`, `projects`, `invoices`, `finance`, `dashboard`

### Backend API Expectations
All endpoints prefixed with `/api/v1/`:
- `GET /clients`, `POST /clients`, `GET /clients/:id`, `PUT /clients/:id`, `DELETE /clients/:id`
- `GET /projects`, `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`
- `GET /invoices`, `POST /invoices`, `GET /invoices/:id`, `PUT /invoices/:id`, `DELETE /invoices/:id`
- `GET /income`, `POST /income`
- `GET /expenses`, `POST /expenses`

### Component Structure
- **Pages** (`src/pages/`): Top-level route components organized by feature
  - Dashboard, Clients, Projects, Invoices, Finance, Reports
- **Components** (`src/components/`): Reusable UI components
  - `auth/`: Authentication-related components
  - `dashboard/`: KPICard, ProjectProfitability, OutstandingInvoices (uses Recharts)
  - `layout/`: Sidebar, TopHeader
- **Layouts** (`src/layouts/`): MainLayout with Sidebar + TopHeader + Outlet pattern
- **Contexts** (`src/contexts/`): React Context providers (currently AuthContext only)

### Routing
- Uses React Router v6 with nested routes
- MainLayout wraps all authenticated routes via `<Outlet />`
- All routes protected by RequireAuth component
- Login page is the only public route

### Styling
- Pure CSS with component-level CSS files (e.g., `Dashboard.css`, `KPICard.css`)
- No CSS-in-JS or utility frameworks
- Custom CSS for layout using flexbox/grid

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

## Deployment

Configured for Vercel with SPA routing (`vercel.json` rewrites all routes to `/index.html`).

For other platforms, ensure SPA rewrites are configured to handle client-side routing.
