# Architecture Firm Management Panel

Overview
A production-ready React + Vite frontend for managing an Architecture Firm's operations.

## Features
- **Dashboard**: Real-time KPIs, Profitability charts.
- **Clients**: CRM with budget tracking.
- **Projects**: Timeline, status, and financials.
- **Invoices & Finance**: Income/Expense tracking.
- **Authentication**: Supabase Auth Integration.

## Backend Integration
This frontend is configured to consume a REST API (Node.js/Supabase) and uses Supabase Auth.

### 1. Environment Configuration
Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
```

### 2. API Endpoints
The app expects the following REST endpoints (prefixed by `VITE_API_BASE_URL`):
- `GET /api/v1/clients`
- `GET /api/v1/projects`
- `GET /api/v1/invoices`
- `GET /api/v1/income`
- `GET /api/v1/expenses`

### 3. Data Mapping
The frontend includes a Service Layer (`src/services/api.js`) that automatically transforms snake_case backend responses to the camelCase format used by the UI components.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Deployment
- **Vercel**: A `vercel.json` is included for SPA routing.
- **Netlify**: Ensure a `_redirects` file is created if deploying to Netlify.
