# Galați Civic Frontend (React + Vite)

## Development

```bash
npm install
npm run dev
```

## Smoke validation in development mode

Use this lightweight smoke check after frontend/backend fixes without introducing a test framework.

### Run
```bash
./scripts/smoke-frontend-dev.sh
```

### What is validated
1. Vite dev server starts.
2. Main routes return the SPA shell in dev mode:
   - `/`
   - `/dashboard`
   - `/my-issues`
   - `/login`
   - `/admin`
3. Issue-list API path is reachable at `FRONTEND_API_URL/issues` (defaults to `http://127.0.0.1:5050/api/issues`).

### Pass / fail expectations
- **PASS**: Script prints per-route checks and ends with `Frontend smoke checks passed`.
- **FAIL**: Script exits non-zero and prints useful response/log output.

### Common failure diagnostics
- Dev server never starts: run `npm install` and inspect `.smoke-frontend.log`.
- Route check fails: ensure Vite is serving on the requested port and no proxy is intercepting.
- API check fails: start backend smoke first or set a reachable API base.

### Useful overrides
- `FRONTEND_SMOKE_PORT=4175 ./scripts/smoke-frontend-dev.sh`
- `FRONTEND_API_URL=https://example.com/api ./scripts/smoke-frontend-dev.sh`

## Table API helper

For reading/writing extra Supabase tables through the backend API, use `src/services/tableApi.js`.

Example:

```js
import { listTableRows, createTableRow } from './services/tableApi';

const categories = await listTableRows('categories', { limit: 50, orderBy: 'name', ascending: true });
await createTableRow('categories', { name: 'Iluminat public', color: '#f59e0b' });
```

The backend must allow the table in:
- `SUPABASE_READ_TABLES` for reads
- `SUPABASE_WRITE_TABLES` for writes

## Environment variables

Create a `.env` file in `galati-civic-frontend/` and define:

```bash
# Required: backend API base URL used by src/services/apiClient.js
VITE_API_URL=https://severin-bumbaru-2026.onrender.com/api

# Required for Supabase auth/storage calls
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: run frontend with mock data instead of backend requests
VITE_USE_MOCK=false
```

Notes:
- `VITE_API_URL` is the single source of truth for API requests and is read via `apiBaseUrl` in `src/services/apiClient.js`.
- Keep the `/api` suffix in `VITE_API_URL` so endpoint paths like `/issues` resolve correctly.
