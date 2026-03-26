# Galați Civic Frontend (React + Vite)

Frontend for creating, browsing and managing civic issues.

## Tech stack
- React 19
- Vite
- React Router
- Axios
- Supabase JS (auth/storage integrations)

## Project structure
- `src/pages/` – route pages (`Home`, `Dashboard`, `CreateIssue`, `Admin`, `Login`, `Register`)
- `src/features/issues/` – issue creation, editing and ownership logic
- `src/features/map/` – map markers, popup cards and location picker
- `src/services/` – API clients (`issuesApi`, `apiClient`, `tableApi`)
- `src/context/AuthContext.jsx` – auth state

## Environment variables
Create `.env` in `galati-civic-frontend/`:

```bash
# backend API base URL (must include /api)
VITE_API_URL=http://127.0.0.1:5050/api

# Supabase public client values
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# optional local mock mode
VITE_USE_MOCK=false
```

## Run locally
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
npm run preview
```

## Backend contract assumptions
Frontend assumes backend uses `issues` as main entity and exposes:
- `/issues`
- `/issues/my`
- `/issues/:id/vote`

If database is migrated from old `reports*` naming, backend migration should already be applied:
- `galati-civic-backend/supabase/migrations/20260326_rename_reports_to_issues_support_tables.sql`

## Table API helper
For admin/ops table-level interactions through backend:
- `src/services/tableApi.js`

Example:
```js
import { listTableRows, createTableRow } from './services/tableApi';

const categories = await listTableRows('categories', {
  limit: 50,
  orderBy: 'name',
  ascending: true,
});

await createTableRow('issues_comments', {
  issue_id: 123,
  user_id: 'user-uuid',
  comment: 'Am observat aceeași problemă în zonă.',
});
```

## Smoke validation (dev mode)
```bash
./scripts/smoke-frontend-dev.sh
```

Validated:
1. Vite dev server starts
2. Routes return SPA shell (`/`, `/dashboard`, `/my-issues`, `/login`, `/admin`)
3. API endpoint for issues is reachable
